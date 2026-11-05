import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import * as notificationsController from './notifications.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/read-all', notificationsController.markAllNotificationsAsRead);
router.patch('/:id/read', notificationsController.markNotificationAsRead);
export default router;
