import { sendError } from '../utils/response.js';
import { authMiddleware } from './jwt.middleware.js';
export const requireAuth = authMiddleware;

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { status: 401, message: 'Vui lòng đăng nhập để tiếp tục!' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, { status: 403, message: 'Bạn không có quyền thực hiện thao tác này!' });
    }
    next();
  };
};
