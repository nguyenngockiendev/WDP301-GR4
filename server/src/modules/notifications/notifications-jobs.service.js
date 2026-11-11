import Invoices from '../../models/Invoices.js';
import Notifications from '../../models/Notifications.js';
import Users from '../../models/Users.js';
import Rooms from '../../models/Rooms.js';
import Properties from '../../models/Properties.js';
import Contracts from '../../models/Contracts.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import RentalRequests from '../../models/RentalRequests.js';
import { notifyRecipient } from './notifications.events.js';
import { getContractStartCutoff } from '../contracts/contract-dates.js';

// Một sự kiện chỉ tạo một bản cho mỗi người, kể cả khi chạy lại sau lỗi.
export const sendSystemNotification = async (eventKey, recipient, title, content, related) => {
  if (!(await Users.exists({ _id: recipient, status: 'active' }))) return;
  try {
    const result = await Notifications.updateOne(
      { eventKey, recipient },
      {
        $setOnInsert: {
          eventKey,
          recipient,
          title,
          content,
          related,
          type: 'system',
          isRead: false,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount) notifyRecipient(recipient);
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

export const notifyRentalResult = async request => {
  if (!request.notificationPending || !['approved', 'rejected'].includes(request.status)) return;
  const room = await Rooms.findById(request.room).select('roomNumber').lean();
  await sendSystemNotification(
    `rental:${request.id}:${request.status}`,
    request.tenant,
    request.status === 'approved' ? 'Yêu cầu thuê đã được duyệt' : 'Yêu cầu thuê bị từ chối',
    `Phòng ${room?.roomNumber || '—'}. ${request.status === 'approved' ? 'Quản lý sẽ liên hệ để lập hợp đồng.' : request.rejectReason || 'Liên hệ quản lý để biết thêm chi tiết.'}`,
    { entityType: 'rental_request', entityId: request._id },
  );
  await RentalRequests.updateOne(
    { _id: request._id, status: request.status },
    { $set: { notificationPending: false } },
  );
};

// Nhắc một lần mỗi ngày Việt Nam, sau thời gian gia hạn đã lưu trên hợp đồng.
export const notifyOverdueInvoices = async (now = new Date()) => {
  const today = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  for await (const invoice of Invoices.find({
    checkoutPaymentInvoice: null,
    status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
    sentAt: { $type: 'date', $lte: now },
    dueDate: { $lt: now },
    $expr: { $gt: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] },
  }).cursor()) {
    const balance = invoice.totalAmount - (invoice.paidAmount ?? 0);
    if (!Number.isSafeInteger(balance) || balance <= 0) continue;
    const contract = await Contracts.findById(invoice.contract)
      .select('representative room paymentGraceDays')
      .lean();
    if (!contract) continue;
    const room = await Rooms.findById(contract.room).select('roomNumber property').lean();
    const property =
      room && (await Properties.findById(room.property).select('status contractPolicy').lean());
    if (!property || property.status !== 'active') continue;
    const graceDays = contract.paymentGraceDays ?? property.contractPolicy?.paymentGraceDays ?? 0;
    if (!Number.isInteger(graceDays) || graceDays < 0) continue;
    const dueDay = new Date(invoice.dueDate.getTime() + 7 * 3600000).toISOString().slice(0, 10);
    const overdueDays = Math.round((Date.parse(today) - Date.parse(dueDay)) / 86400000);
    if (overdueDays <= graceDays) continue;
    const recipient = invoice.billedTo || contract.representative;
    if (!(await Users.exists({ _id: recipient, role: 'tenant', status: 'active' }))) continue;
    await sendSystemNotification(
      `invoice-overdue:${invoice.id}:${invoice.dueDate.toISOString()}:${today}`,
      recipient,
      `Hóa đơn đã quá hạn ${overdueDays} ngày`,
      `${invoice.invoiceType === 'checkout_payment' ? 'Hóa đơn trả phòng' : `Hóa đơn kỳ ${invoice.billingMonth}`}, phòng ${room.roomNumber} đã quá hạn ${overdueDays} ngày. Còn phải trả ${balance.toLocaleString('vi-VN')} ₫. Vui lòng kiểm tra và thanh toán hóa đơn.`,
      { entityType: 'invoice', entityId: invoice._id },
    );
  }
};

export const runNotificationJobs = async (now = new Date()) => {
  await notifyOverdueInvoices(now);
  for await (const request of RentalRequests.find({ notificationPending: true }).cursor())
    await notifyRentalResult(request);
  const until = new Date(now.getTime() + 7 * 86400000);
  for await (const contract of Contracts.find({
    status: 'active',
    startDate: { $lte: getContractStartCutoff(now) },
    endDate: { $gt: now, $lte: until },
  }).cursor()) {
    const room = await Rooms.findById(contract.room).select('property roomNumber').lean();
    if (!room) continue;
    const property = await Properties.findById(room.property).select('owner status').lean();
    if (!property || property.status !== 'active') continue;
    const managerIds = await ManagerAssignments.distinct('manager', {
      property: room.property,
      status: 'active',
    });
    const managers = await Users.find({
      _id: { $in: managerIds },
      role: 'manager',
      status: 'active',
    })
      .select('_id')
      .lean();
    const ids = new Set(
      [
        property.owner,
        ...managers.map(item => item._id),
        contract.representative,
        ...contract.otherMembers,
      ]
        .filter(Boolean)
        .map(String),
    );
    for (const recipient of ids) {
      await sendSystemNotification(
        `contract-expiry:${contract.id}:${contract.endDate.toISOString()}`,
        recipient,
        'Hợp đồng sắp hết hạn',
        `Hợp đồng phòng ${room.roomNumber} hết hạn ngày ${contract.endDate.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}. Vui lòng xem xét gia hạn hoặc trả phòng.`,
        { entityType: 'contract', entityId: contract._id },
      );
    }
  }
};

export const startNotificationJobs = () => {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await runNotificationJobs();
    } catch (error) {
      console.error('[Notifications] Chưa hoàn tất lượt xử lý:', error.message);
    } finally {
      running = false;
    }
  };
  run();
  const timer = setInterval(run, 60 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
};
