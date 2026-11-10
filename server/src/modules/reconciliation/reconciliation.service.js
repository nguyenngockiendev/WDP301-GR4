import mongoose from 'mongoose';
import { readVnpayResult } from '../payments/vnpay.service.js';
import { confirmGatewayPayment } from '../payments/payments.service.js';
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
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1) - 7 * 3600000);
  const end = new Date(Date.UTC(year, monthNumber, 1) - 7 * 3600000);
  const invoices = await Invoices.find({
    contract: { $in: contracts.map(item => item._id) },
    $or: [
      { billingMonth: month },
      { invoiceType: 'deposit', sentAt: { $gte: start, $lt: end } },
    ],
  })
    .select('contract billingMonth invoiceType totalAmount paidAmount status dueDate')
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  // Lấy mọi giao dịch của hóa đơn trong kỳ, kể cả tiền được trả ở tháng khác.
  const payments = await Payments.find({ invoice: { $in: invoices.map(item => item._id) } })
    .select('invoice amount status method provider gatewayTransactionId expiresAt paidAt createdAt')
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  const now = new Date();
  // Dùng nhật ký để kiểm tra; không trả dữ liệu kỹ thuật về giao diện quản lý.
  const events = await GatewayEvents.find({
    txnRef: { $in: payments.map(item => String(item._id)) },
  })
    .select(
      'provider source txnRef gatewayTransactionNo amount responseCode transactionStatus signatureValid processResult resultCode receivedAt processedAt raw rawTruncated',
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
    const recoveryActions = [];
    for (const payment of transactions) {
      if (payment.method !== 'gateway' || (payment.provider && payment.provider !== 'vnpay'))
        continue;
      const paymentEvents = gatewayEvents.filter(event => event.txnRef === String(payment._id));
      const confirmation = paymentEvents.find(event => getVerifiedResult(event, payment));
      if (payment.status !== 'success' && confirmation) {
        issues.push(
          'Có xác nhận thanh toán thành công nhưng hệ thống chưa cập nhật. Không yêu cầu khách thanh toán lại.',
        );
        if (
          received === recorded &&
          ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status) &&
          Number.isSafeInteger(recorded) &&
          recorded >= 0 &&
          invoice.totalAmount - recorded >= payment.amount
        ) {
          recoveryActions.push({ paymentId: payment._id, amount: payment.amount });
        }
      }
      if (
        paymentEvents.some(
          event => event.signatureValid === true && event.amount !== payment.amount,
        )
      ) {
        issues.push(
          'Số tiền trong xác nhận thanh toán khác số tiền giao dịch. Liên hệ người hỗ trợ kiểm tra trước khi ghi nhận.',
        );
      }
      if (
        payment.status !== 'success' &&
        !confirmation &&
        paymentEvents.some(
          event =>
            ['ERROR', 'INVALID_SIGNATURE', 'INVALID_PAYLOAD'].includes(event.processResult) ||
            (['RECEIVED', 'PROCESSING'].includes(event.processResult) &&
              now - event.receivedAt > 5 * 60 * 1000),
        )
      ) {
        issues.push(
          'Chưa xác nhận được kết quả thanh toán. Liên hệ người hỗ trợ và cung cấp mã giao dịch; không tự ghi nhận đã trả.',
        );
      }
    }
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
      invoiceType: invoice.invoiceType,
      roomNumber: room.roomNumber,
      propertyName: property.name,
      invoiceStatus: invoice.status,
      totalAmount: invoice.totalAmount,
      recorded,
      received,
      difference: recorded - received,
      status: rowStatus,
      issues: [...new Set(issues)],
      recoveryActions,
      guidance: issues.length
        ? 'Nếu cập nhật không thành công hoặc số tiền vẫn không khớp, cung cấp mã hóa đơn và mã giao dịch cho người hỗ trợ kiểm tra.'
        : null,
      transactions,
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

// Kiểm tra lại chữ ký từ dữ liệu gốc, không chỉ tin cờ đã lưu trong nhật ký.
const getVerifiedResult = (event, payment) => {
  if (!(payment.expiresAt instanceof Date)) return null;
  if (event.provider && event.provider !== 'vnpay') return null;
  if (!event.signatureValid || event.rawTruncated || !['IPN', 'RETURN'].includes(event.source))
    return null;
  try {
    const result = readVnpayResult(event.raw, event.source === 'IPN');
    if (
      !result?.success ||
      result.paymentCode !== String(payment._id) ||
      result.amount !== payment.amount ||
      !Number.isSafeInteger(result.amount) ||
      result.amount <= 0 ||
      !/^[1-9]\d*$/.test(result.gatewayTransactionId || '') ||
      !result.paidAt
    )
      return null;
    return result;
  } catch {
    return null;
  }
};

export const syncPayment = async (paymentId, userId) => {
  if (!mongoose.isObjectIdOrHexString(paymentId))
    throw { status: 400, message: 'Mã giao dịch không hợp lệ.' };
  const user = await Users.findById(userId).select('role status');
  if (user?.role !== 'manager' || user.status !== 'active')
    throw { status: 403, message: 'Chỉ quản lý đang hoạt động được cập nhật.' };
  const payment = await Payments.findById(paymentId);
  const invoice = payment && (await Invoices.findById(payment.invoice));
  const contract = invoice && (await Contracts.findById(invoice.contract));
  const room = contract && (await Rooms.findById(contract.room));
  if (
    !room ||
    !(await ManagerAssignments.exists({
      manager: userId,
      property: room.property,
      status: 'active',
    }))
  ) {
    throw { status: 403, message: 'Bạn không được cập nhật giao dịch của dãy trọ này.' };
  }
  if (payment.method !== 'gateway' || (payment.provider && payment.provider !== 'vnpay')) {
    throw { status: 400, message: 'Chức năng này chỉ cập nhật giao dịch VNPay.' };
  }
  if (payment.status === 'success') return { message: 'Giao dịch đã được ghi nhận trước đó.' };
  const events = await GatewayEvents.find({ txnRef: payment.id, signatureValid: true }).sort({
    receivedAt: -1,
  });
  let result;
  for (const event of events) {
    result = getVerifiedResult(event, payment);
    if (result) break;
  }
  if (!result)
    throw {
      status: 409,
      message: 'Chưa có xác nhận hợp lệ để cập nhật. Vui lòng liên hệ người hỗ trợ.',
    };
  const code = await confirmGatewayPayment(result, userId);
  if (!['00', '02'].includes(code))
    throw {
      status: 409,
      message:
        'Chưa thể cập nhật vì dữ liệu hóa đơn hoặc giao dịch không khớp. Vui lòng liên hệ người hỗ trợ.',
    };
  return { message: 'Đã ghi nhận thanh toán vào hóa đơn.' };
};
