import bcrypt from 'bcryptjs';
import Users from '../../models/Users.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { Router } from 'express';
import { register, login, LoginByGoogleController, forgotPasswordController, SenOtpController } from './auth.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { createLimiter } from '../../shared/middlewares/middlewave.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login/google', createLimiter(5, 3), LoginByGoogleController);
router.post('/forgot-password', createLimiter(5, 3), forgotPasswordController);
router.post('/send-otp', createLimiter(5, 3), SenOtpController);

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await Users.findById(req.user.userId)
      .select('username fullName email phone role status isVerified createdAt').lean();
    if (!user) return sendError(res, { status: 404, message: 'Không tìm thấy tài khoản' });
    return sendSuccess(res, 200, 'Thông tin tài khoản', user);
  } catch (error) { return sendError(res, error); }
});

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const phone = String(req.body.phone || '').trim();
    if (fullName.length < 2 || fullName.length > 100 || phone.length > 30) return sendError(res, { status: 400, message: 'Họ tên hoặc số điện thoại không hợp lệ' });
    const user = await Users.findByIdAndUpdate(req.user.userId, { $set: { fullName, phone } }, { new: true, runValidators: true })
      .select('username fullName email phone role status isVerified createdAt');
    if (!user) return sendError(res, { status: 404, message: 'Không tìm thấy tài khoản' });
    return sendSuccess(res, 200, 'Đã lưu thông tin tài khoản', user);
  } catch (error) { return sendError(res, error); }
});

router.post('/password', requireAuth, createLimiter(5, 3), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128)
      return sendError(res, { status: 400, message: 'Mật khẩu mới phải từ 8 đến 128 ký tự' });
    const user = await Users.findById(req.user.userId);
    if (!user || !user.password || !await bcrypt.compare(currentPassword, user.password))
      return sendError(res, { status: 400, message: 'Mật khẩu hiện tại không chính xác hoặc tài khoản chưa có mật khẩu' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return sendSuccess(res, 200, 'Mật khẩu đã được cập nhật');
  } catch (error) { return sendError(res, error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: req.user } }));
export default router;
