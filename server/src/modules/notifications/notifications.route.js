import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/jwt.middleware.js';
import * as controller from './notifications.controller.js';

const router = Router();
router.use(authMiddleware);
router.use((req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.user?.userId || '')) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
  }
  next();
});
router.get('/', (req, res, next) => {
  const { page = '1', limit = '10', status = 'all' } = req.query;
  if (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page)) ||
      typeof limit !== 'string' || !/^[1-9]\d*$/.test(limit) || Number(limit) > 100 ||
      !['all', 'read', 'unread'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Bộ lọc hoặc phân trang không hợp lệ.' });
  }
  req.notificationQuery = { page: Number(page), limit: Number(limit), status };
  next();
}, controller.list);
router.get('/unread-count', controller.unread);
router.patch('/read-all', controller.readAll);
router.patch('/:id/read', (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'ID thông báo không hợp lệ.' });
  }
  next();
}, controller.read);
export default router;
