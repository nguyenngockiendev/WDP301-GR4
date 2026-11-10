import Users from '../../models/Users.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import Notifications from '../../models/Notifications.js';
import { notifyRecipient } from './notifications.events.js';

const getManagedPropertyIds = async userId => {
  const user = await Users.findById(userId).select('role status').lean();
  if (!user || user.status !== 'active' || !['manager', 'landlord'].includes(user.role)) {
    throw { status: 403, message: 'Chỉ chủ trọ hoặc quản lý đang hoạt động được gửi thông báo.' };
  }
  if (user.role === 'landlord')
    return Properties.distinct('_id', { owner: userId, status: 'active' });
  return ManagerAssignments.distinct('property', { manager: userId, status: 'active' });
};

export const getNotificationRecipients = async userId => {
  const propertyIds = await getManagedPropertyIds(userId);
  const properties = await Properties.find({ _id: { $in: propertyIds }, status: 'active' })
    .select('name')
    .lean();
  const sender = await Users.findById(userId).select('role').lean();
  if (sender.role === 'landlord') {
    const assignments = await ManagerAssignments.find({
      property: { $in: properties.map(item => item._id) },
      status: 'active',
    })
      .populate('manager', 'fullName role status')
      .lean();
    const recipients = [];
    for (const assignment of assignments) {
      const manager = assignment.manager;
      if (!manager || manager.status !== 'active' || manager.role !== 'manager') continue;
      if (
        recipients.some(
          item =>
            item.recipientId === String(manager._id) &&
            item.propertyId === String(assignment.property),
        )
      )
        continue;
      recipients.push({
        recipientId: String(manager._id),
        fullName: manager.fullName,
        propertyId: String(assignment.property),
        propertyName: properties.find(item => String(item._id) === String(assignment.property))
          .name,
        roomNumber: 'Quản lý',
      });
    }
    return recipients;
  }
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
  if (['property', 'properties'].includes(data.audience)) {
    const propertyIds = await getManagedPropertyIds(userId);
    const chosenIds = data.audience === 'properties' ? data.propertyIds : [data.propertyId];
    if (!chosenIds.every(chosen => propertyIds.some(id => String(id) === chosen))) {
      throw { status: 403, message: 'Bạn không được gửi thông báo cho dãy trọ này.' };
    }
    const matches = (await getNotificationRecipients(userId)).filter(item =>
      chosenIds.includes(item.propertyId),
    );
    const recipients = [...new Map(matches.map(item => [item.recipientId, item])).values()];
    if (!recipients.length)
      throw { status: 400, message: 'Dãy trọ chưa có người thuê đủ điều kiện nhận thông báo.' };
    // Ghi cả lượt trong một transaction để không gửi dở dang khi DB lỗi.
    await Notifications.db.transaction(async session => {
      await Notifications.insertMany(
        recipients.map(item => ({
          sender: userId,
          recipient: item.recipientId,
          property: item.propertyId,
          title: data.title,
          content: data.content,
          type: 'announcement',
        })),
        { session },
      );
    });
    for (const recipient of recipients) notifyRecipient(recipient.recipientId);
    return { sentCount: recipients.length };
  }
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
