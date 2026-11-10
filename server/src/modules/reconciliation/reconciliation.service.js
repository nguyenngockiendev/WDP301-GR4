import Users from '../../models/Users.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';
import GatewayEvents from '../../models/GatewayEvents.js';

export const getReconciliation = async (userId, query) => {
  const user = await Users.findById(userId).select('role status').lean();
  if (!user || user.role !== 'manager' || user.status !== 'active') {
    throw { status: 403, message: 'Chỉ quản lý đang hoạt động được xem đối soát.' };
  }
  const month =
    query.month ||
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 7);
  const { propertyId, status = 'all' } = query;
  const page = Number(query.page || 1);
  if (
    typeof month !== 'string' ||
    !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month) ||
    !['all', 'matched', 'review'].includes(status) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    (propertyId !== undefined &&
      (typeof propertyId !== 'string' || !/^[a-f\d]{24}$/i.test(propertyId)))
  ) {
    throw { status: 400, message: 'Bộ lọc đối soát không hợp lệ.' };
  }
  const ids = await ManagerAssignments.distinct('property', { manager: userId, status: 'active' });
  const properties = await Properties.find({ _id: { $in: ids } })
    .select('name')
    .sort({ name: 1 })
    .lean();
  if (propertyId && !properties.some(item => String(item._id) === propertyId.toLowerCase())) {
    throw { status: 403, message: 'Bạn không được đối soát dãy trọ này.' };
  }
  const rooms = await Rooms.find({
    property: propertyId || { $in: properties.map(item => item._id) },
  })
    .select('roomNumber property')
    .lean();
  const contracts = await Contracts.find({ room: { $in: rooms.map(item => item._id) } })
    .select('room')
    .lean();
  const invoices = await Invoices.find({
    contract: { $in: contracts.map(item => item._id) },
    billingMonth: month,
  })
    .select('contract billingMonth totalAmount paidAmount status dueDate')
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  // Lấy mọi giao dịch của hóa đơn trong kỳ, kể cả tiền được trả ở tháng khác.
  const payments = await Payments.find({ invoice: { $in: invoices.map(item => item._id) } })
    .select('invoice amount status method provider gatewayTransactionId expiresAt paidAt createdAt')
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  const now = new Date();
  // Chỉ trả nhật ký có mã Payment thuộc hóa đơn trong phạm vi quản lý.
  const events = await GatewayEvents.find({
    txnRef: { $in: payments.map(item => String(item._id)) },
  })
    .select(
      'source txnRef gatewayTransactionNo amount responseCode transactionStatus signatureValid processResult resultCode receivedAt processedAt',
    )
    .sort({ receivedAt: -1, _id: -1 })
    .lean();
  const rows = invoices.map(invoice => {
    const contract = contracts.find(item => String(item._id) === String(invoice.contract));
    const room = rooms.find(item => String(item._id) === String(contract.room));
    const property = properties.find(item => String(item._id) === String(room.property));
    const transactions = payments.filter(item => String(item.invoice) === String(invoice._id));
    const successful = transactions.filter(item => item.status === 'success');
    const received = successful.reduce((sum, item) => sum + item.amount, 0);
    const recorded = invoice.paidAmount ?? 0;
    const issues = [];
    const paymentIds = new Set(transactions.map(item => String(item._id)));
    const gatewayEvents = events.filter(event => paymentIds.has(event.txnRef));
    if (
      gatewayEvents.some(event =>
        ['INVALID_SIGNATURE', 'INVALID_PAYLOAD'].includes(event.processResult),
      )
    ) {
      issues.push('Có callback không hợp lệ; chưa thể coi là xác nhận từ VNPay');
    }
    if (gatewayEvents.some(event => event.processResult === 'AMOUNT_MISMATCH'))
      issues.push('Có callback báo số tiền khác giao dịch');
    if (
      gatewayEvents.some(
        event =>
          event.signatureValid === true &&
          event.responseCode === '00' &&
          event.transactionStatus === '00' &&
          transactions.find(item => String(item._id) === event.txnRef)?.status !== 'success',
      )
    ) {
      issues.push('Callback hợp lệ báo thành công nhưng giao dịch chưa ghi nhận thành công');
    }
    if (
      gatewayEvents.some(
        event =>
          ['RECEIVED', 'PROCESSING'].includes(event.processResult) &&
          now - event.receivedAt > 5 * 60 * 1000,
      )
    )
      issues.push('Có callback chưa xử lý xong quá 5 phút');
    if (
      gatewayEvents.some(
        event =>
          event.processResult === 'ERROR' &&
          transactions.find(item => String(item._id) === event.txnRef)?.status !== 'success',
      )
    )
      issues.push('Có callback gặp lỗi xử lý');
    if (
      ![invoice.totalAmount, recorded, ...transactions.map(item => item.amount)].every(
        value => Number.isSafeInteger(value) && value >= 0,
      )
    )
      issues.push('Số tiền không hợp lệ');
    if (received !== recorded)
      issues.push('Tiền giao dịch thành công khác số tiền đã ghi nhận trên hóa đơn');
    if (received > invoice.totalAmount || recorded > invoice.totalAmount)
      issues.push('Số tiền vượt tổng hóa đơn');
    if (invoice.status === 'paid' && recorded !== invoice.totalAmount)
      issues.push('Hóa đơn ghi đã trả nhưng số tiền chưa khớp');
    if (
      invoice.status !== 'paid' &&
      invoice.status !== 'cancelled' &&
      recorded >= invoice.totalAmount
    )
      issues.push('Đã ghi đủ tiền nhưng hóa đơn chưa chuyển đã thanh toán');
    if (invoice.status === 'partially_paid' && (recorded <= 0 || recorded >= invoice.totalAmount))
      issues.push('Trạng thái trả một phần không khớp số tiền');
    if (invoice.status === 'unpaid' && recorded > 0)
      issues.push('Hóa đơn chưa thanh toán nhưng đã ghi nhận tiền');
    if (invoice.status === 'cancelled' && (received > 0 || recorded > 0))
      issues.push('Hóa đơn đã hủy có tiền thanh toán');
    if (
      transactions.some(
        item => item.status === 'pending' && item.expiresAt && item.expiresAt <= now,
      )
    )
      issues.push('Có giao dịch chờ đã hết hạn, cần kiểm tra');
    if (successful.some(item => !item.paidAt))
      issues.push('Giao dịch thành công thiếu ngày thanh toán');
    if (successful.some(item => item.method === 'gateway' && !item.gatewayTransactionId))
      issues.push('Giao dịch cổng thiếu mã tham chiếu');
    const references = successful
      .filter(item => item.method === 'gateway' && item.gatewayTransactionId)
      .map(item => `${item.provider || 'vnpay'}:${item.gatewayTransactionId}`);
    if (new Set(references).size !== references.length)
      issues.push('Mã giao dịch cổng bị trùng trên hóa đơn');
    const rowStatus = issues.length ? 'review' : 'matched';
    return {
      invoiceId: invoice._id,
      roomNumber: room.roomNumber,
      propertyName: property.name,
      invoiceStatus: invoice.status,
      totalAmount: invoice.totalAmount,
      recorded,
      received,
      difference: recorded - received,
      status: rowStatus,
      issues,
      transactions,
      gatewayEventCount: gatewayEvents.length,
      gatewayEvents: gatewayEvents.slice(0, 20),
    };
  });
  const summary = { total: rows.length, matched: 0, review: 0 };
  for (const row of rows) summary[row.status]++;
  const filtered = status === 'all' ? rows : rows.filter(row => row.status === status);
  return {
    properties,
    summary,
    month,
    generatedAt: now,
    items: filtered.slice((page - 1) * 10, page * 10),
    page,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / 10),
  };
};
