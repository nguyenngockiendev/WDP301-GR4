import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../../models/Notifications.js';
import { AppError } from '../../shared/utils/errors.js';

export default function notificationRoutes() {
  const router = Router();

  router.get('/', async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const recipient = new mongoose.Types.ObjectId(req.user.id);
    const [items, total, unread] = await Promise.all([
      Notification.find({ recipient }).sort({ createdAt: -1 }).skip((page - 1) * 15).limit(15).lean(),
      Notification.countDocuments({ recipient }),
      Notification.countDocuments({ recipient, readAt: null }),
    ]);
    res.json({ page, items, total, unread });
  });

  router.patch('/read-all', async (req, res) => {
    const recipient = new mongoose.Types.ObjectId(req.user.id);
    await Notification.updateMany(
      { recipient, readAt: null },
      { $set: { isRead: true, readAt: new Date() } },
    );
    res.json({ ok: true });
  });

  router.patch('/:id/read', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Notification not found.', 404);
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    ).lean();
    if (!item) throw new AppError('Notification not found.', 404);
    res.json({ item });
  });

  return router;
}
