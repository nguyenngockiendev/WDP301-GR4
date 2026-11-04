import { sendError } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import Users from '../../models/Users.js';

export const requireAuth = async (req, res, next) => {
  if (!req.session?.user) {
    return sendError(res, { status: 401, message: 'Vui lòng đăng nhập để tiếp tục!' });
  }
  try {
    if (typeof req.session.user === 'string') {
      const decoded = jwt.verify(req.session.user, process.env.JWT_SECRET);
      const user = await Users.findById(decoded.userId).select('-password').lean();
      req.user = user ? { ...user, userId: String(user._id) } : null;
    } else {
      req.user = req.session.user;
      req.user.userId = req.user.userId || req.user._id || req.user.id;
    }
    if (!req.user) return sendError(res, { status: 401, message: 'Phiên đăng nhập không hợp lệ!' });
    return next();
  } catch (error) {
    return sendError(res, { status: 401, message: 'Phiên đăng nhập đã hết hạn!' });
  }
};

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
