import Notifications from '../../models/Notifications.js';

export async function listNotifications(recipient, { page, limit, status }) {
  const filter = { recipient };
  if (status !== 'all') filter.isRead = status === 'read';
  const [items, total, unreadCount] = await Promise.all([
    Notifications.find(filter).sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    Notifications.countDocuments(filter),
    Notifications.countDocuments({ recipient, isRead: false }),
  ]);
  return { items, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function countUnread(recipient) {
  return { unreadCount: await Notifications.countDocuments({ recipient, isRead: false }) };
}

export async function markRead(recipient, id) {
  const notification = await Notifications.findOneAndUpdate(
    { _id: id, recipient }, { $set: { isRead: true } }, { new: true },
  ).lean();
  if (!notification) throw { status: 404, message: 'Không tìm thấy thông báo.' };
  return notification;
}

export async function markAllRead(recipient) {
  const result = await Notifications.updateMany(
    { recipient, isRead: false }, { $set: { isRead: true } },
  );
  return { modifiedCount: result.modifiedCount };
}

// Internal entry point for other modules; never accepts a recipient from a public API.
export function createNotification({ recipient, title, content, type = 'general', related }) {
  return Notifications.create({ recipient, title, content, type, related });
}
