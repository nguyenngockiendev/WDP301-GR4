import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/security.js';

export default function authRoutes(controller, limiter) {
  const router = Router();
  router.post('/register', limiter, controller.register);
  router.post('/verify-email', limiter, controller.verifyEmail);
  router.post('/resend-verification', limiter, controller.resendVerification);
  router.post('/forgot-password', limiter, controller.requestPasswordReset);
  router.post('/reset-password', limiter, controller.resetPassword);
  router.post('/login', limiter, controller.login);
  router.post('/logout', requireAuth, controller.logout);
  router.post('/password', requireAuth, controller.changePassword);
  return router;
}
