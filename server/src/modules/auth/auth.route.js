import { Router } from 'express';
import { register, login, verifyOtp, resendOtp, me, logout, profile, password } from './auth.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(validateRegister), register);
router.post('/login', validate(validateLogin), login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);
router.put('/profile', requireAuth, profile);
router.post('/change-password', requireAuth, password);

export default router;
