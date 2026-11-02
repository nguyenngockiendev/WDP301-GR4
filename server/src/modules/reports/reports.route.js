import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function reportRoutes(controller) {
  const router = Router();
  router.get('/', roles('LANDLORD', 'MANAGER'), controller.summary);
  return router;
}
