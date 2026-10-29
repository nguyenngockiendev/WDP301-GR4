import * as service from './notifications.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const list = async (req, res) =>
  sendSuccess(res, 200, 'Danh sách thông báo', await service.listNotifications(req.user.userId, req.notificationQuery));
export const unread = async (req, res) =>
  sendSuccess(res, 200, 'Số thông báo chưa đọc', await service.countUnread(req.user.userId));
export const read = async (req, res) =>
  sendSuccess(res, 200, 'Đã đọc thông báo', await service.markRead(req.user.userId, req.params.id));
export const readAll = async (req, res) =>
  sendSuccess(res, 200, 'Đã đọc tất cả thông báo', await service.markAllRead(req.user.userId));
