import Users from '../../models/Users.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import Notifications from '../../models/Notifications.js';
import { notifyRecipient } from './notifications.events.js';

// Dùng quyền trong DB để không phụ thuộc role cũ trong JWT.
const getManagedPropertyIds = async userId => {
  const user = await Users.findById(userId).select('role status').lean();
  if (!user || user.status !== 'active' || user.role !== 'manager') {
    throw { status: 403, message: 'Chỉ quản lý đang hoạt động được gửi thông báo.' };
  }
  return ManagerAssignments.distinct('property', { manager: userId, status: 'active' });
};

export const getNotificationRecipients = async userId => {
  const propertyIds = await getManagedPropertyIds(userId);
  const properties = await Properties.find({ _id: { $in: propertyIds }, status: 'active' })
    .select('name')
    .lean();
  const rooms = await Rooms.find({ property: { $in: properties.map(property => property._id) } })
    .select('roomNumber property')
    .lean();
  const now = new Date();
  const contracts = await Contracts.find({
    room: { $in: rooms.map(room => room._id) },
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .select('room representative otherMembers')
    .lean();
  const tenantIds = contracts.flatMap(contract => [
    contract.representative,
    ...contract.otherMembers,
  ]);
  const tenants = await Users.find({ _id: { $in: tenantIds }, role: 'tenant', status: 'active' })
    .select('fullName')
    .lean();
  const recipients = [];
  for (const contract of contracts) {
    const room = rooms.find(room => String(room._id) === String(contract.room));
    const property = properties.find(property => String(property._id) === String(room.property));
    for (const tenantId of [contract.representative, ...contract.otherMembers]) {
      const tenant = tenants.find(tenant => String(tenant._id) === String(tenantId));
      if (
        !tenant ||
        recipients.some(
          item => item.recipientId === String(tenantId) && item.propertyId === String(property._id),
        )
      )
        continue;
      recipients.push({
        recipientId: String(tenant._id),
        fullName: tenant.fullName,
        propertyId: String(property._id),
        propertyName: property.name,
        roomNumber: room.roomNumber,
      });
    }
  }
  return recipients;
};

export const sendNotification = async (userId, data) => {
  const recipients = await getNotificationRecipients(userId);
  const allowed = recipients.some(
    item => item.recipientId === data.recipientId && item.propertyId === data.propertyId,
  );
  if (!allowed)
    throw {
      status: 403,
      message: 'Người nhận không thuộc nhà trọ bạn đang quản lý hoặc không còn hợp đồng hiệu lực.',
    };
  const notification = await Notifications.create({
    sender: userId,
    recipient: data.recipientId,
    property: data.propertyId,
    title: data.title,
    content: data.content,
    type: 'announcement',
  });
  notifyRecipient(data.recipientId);
  return notification;
};

export const getSentNotifications = async (userId, { page, limit }) => {
  const propertyIds = await getManagedPropertyIds(userId);
  const filter = { sender: userId, property: { $in: propertyIds } };
  const [items, total] = await Promise.all([
    Notifications.find(filter)
      .populate('recipient', 'fullName')
      .populate('property', 'name')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notifications.countDocuments(filter),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
};
