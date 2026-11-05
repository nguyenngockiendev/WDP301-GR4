import Notifications from '../../models/Notifications.js';
import { notifyRecipient } from './notifications.events.js';

export const listNotifications = async (recipient, { page, limit, status }) => {
  const filter = { recipient };
  if (status !== 'all') filter.isRead = status === 'read';
  const [items, total, unreadCount] = await Promise.all([
    Notifications.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notifications.countDocuments(filter),
    Notifications.countDocuments({ recipient, isRead: false }),
  ]);
  return { items, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
};

export const countUnread = async recipient => {
  return { unreadCount: await Notifications.countDocuments({ recipient, isRead: false }) };
};

export const markRead = async (recipient, id) => {
  const notification = await Notifications.findOneAndUpdate(
    { _id: id, recipient },
    { $set: { isRead: true } },
    { new: true },
  ).lean();
  if (!notification) throw { status: 404, message: 'Không tìm thấy thông báo.' };
  notifyRecipient(recipient);
  return notification;
};

export const markAllRead = async recipient => {
  const result = await Notifications.updateMany(
    { recipient, isRead: false },
    { $set: { isRead: true } },
  );
  if (result.modifiedCount) notifyRecipient(recipient);
  return { modifiedCount: result.modifiedCount };
};

// Internal entry point for other modules; never accepts a recipient from a public API.
export const createNotification = async ({
  recipient,
  title,
  content,
  type = 'general',
  related,
}) => {
  const notification = await Notifications.create({ recipient, title, content, type, related });
  notifyRecipient(recipient);
  return notification;
};
