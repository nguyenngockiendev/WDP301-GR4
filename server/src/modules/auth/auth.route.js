import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/security.js';

export default function authRoutes(controller, limiter) {
  const router = Router();
  router.post('/register', limiter, controller.register);
  router.post('/login', limiter, controller.login);
  router.post('/logout', requireAuth, controller.logout);
  return router;
}
