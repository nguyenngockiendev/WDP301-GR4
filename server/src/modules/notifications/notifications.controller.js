import * as notificationsService from './notifications.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import { validateNotificationQuery, validateNotificationId } from './notifications.validation.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = validateNotificationQuery(req.query);
    const result = await notificationsService.listNotifications(userId, filters);
    return sendSuccess(res, 200, 'Lấy danh sách thông báo thành công', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await notificationsService.countUnread(userId);
    return sendSuccess(res, 200, 'Lấy số thông báo chưa đọc thành công', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;
    validateNotificationId(notificationId);
    const result = await notificationsService.markRead(userId, notificationId);
    return sendSuccess(res, 200, 'Đánh dấu đã đọc thành công', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await notificationsService.markAllRead(userId);
    return sendSuccess(res, 200, 'Đánh dấu tất cả đã đọc thành công', result);
  } catch (error) {
    return sendError(res, error);
  }
};
