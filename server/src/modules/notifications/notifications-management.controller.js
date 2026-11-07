import * as notificationsService from './notifications-management.service.js';
import { validateSendNotification, validateNotificationQuery } from './notifications.validation.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getNotificationRecipients = async (req, res) => {
  try {
    const recipients = await notificationsService.getNotificationRecipients(req.user.userId);
    return sendSuccess(res, 200, 'Lấy người nhận thành công', recipients);
  } catch (error) {
    return sendError(res, error);
  }
};

export const sendNotification = async (req, res) => {
  try {
    const data = validateSendNotification(req.body);
    const notification = await notificationsService.sendNotification(req.user.userId, data);
    return sendSuccess(res, 201, 'Gửi thông báo thành công', notification);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getSentNotifications = async (req, res) => {
  try {
    const filters = validateNotificationQuery(req.query);
    const notifications = await notificationsService.getSentNotifications(req.user.userId, filters);
    return sendSuccess(res, 200, 'Lấy thông báo đã gửi thành công', notifications);
  } catch (error) {
    return sendError(res, error);
  }
};
