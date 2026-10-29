import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
  }
  try {
    req.user = jwt.verify(authorization.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}
