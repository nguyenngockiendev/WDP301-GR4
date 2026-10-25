import jwt from 'jsonwebtoken';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'NOT AUTHORIZED' });
  }
  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'NOT AUTHORIZED' });
  }
};

const createLimiter = (countlimit, time, byuser = false) => {
  const limit = rateLimit({
    windowMs: time * 60 * 1000,
    max: countlimit,
    keyGenerator: req => {
      if (byuser && req.user?.userId) {
        return `user_${req.user.userId}`;
      }
      return ipKeyGenerator(req.ip);
    },
    handler: (req, res, next) => {
      return res.status(429).json({
        success: false,
        message: `bạn đã quá ${countlimit}lần.Hãy đợi trong ${time} phút nữa!`,
      });
    },
  });
  return limit;
};


const checkRole = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập!',
      });
    }
    next();
  };
};

export { authMiddleware, createLimiter, checkRole };
