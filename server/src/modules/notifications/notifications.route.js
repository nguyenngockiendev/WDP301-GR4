import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import * as notificationsController from './notifications.controller.js';
import * as managementController from './notifications-management.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/recipients', managementController.getNotificationRecipients);
router.get('/sent', managementController.getSentNotifications);
router.post('/send', managementController.sendNotification);
router.get('/', notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/read-all', notificationsController.markAllNotificationsAsRead);
router.patch('/:id/read', notificationsController.markNotificationAsRead);
export default router;
