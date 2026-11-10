import Notifications from '../../models/Notifications.js';
import Users from '../../models/Users.js';
import Rooms from '../../models/Rooms.js';
import Properties from '../../models/Properties.js';
import Contracts from '../../models/Contracts.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import RentalRequests from '../../models/RentalRequests.js';
import { notifyRecipient } from './notifications.events.js';

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

export const runNotificationJobs = async (now = new Date()) => {
  for await (const request of RentalRequests.find({ notificationPending: true }).cursor())
    await notifyRentalResult(request);
  const until = new Date(now.getTime() + 7 * 86400000);
  for await (const contract of Contracts.find({
    status: 'active',
    startDate: { $lte: now },
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
