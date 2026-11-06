import { Router } from 'express';
import Properties from '../../models/Properties.js';
import { authMiddleware } from '../../shared/middlewares/middlewave.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const router = Router();

// Lấy danh sách nhà trọ của user đang đăng nhập (landlord)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const properties = await Properties.find({ owner: req.user.userId }).sort({ createdAt: 1 });
    return sendSuccess(res, 200, 'Lấy danh sách nhà trọ thành công!', properties);
  } catch (error) {
    return sendError(res, error);
  }
});

export default router;
