import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { Router } from 'express';
import { register, login, LoginByGoogleController, forgotPasswordController, SenOtpController, getCurrentUser, logout } from './auth.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { createLimiter } from '../../shared/middlewares/middlewave.js';

const router = Router();

router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.post('/register', register);
router.post('/login', login);
router.post('/login/google', createLimiter(5, 3), LoginByGoogleController);
router.post('/forgot-password', createLimiter(5, 3), forgotPasswordController);
router.post('/send-otp', createLimiter(5, 3), SenOtpController);

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: req.user } }));
export default router;
