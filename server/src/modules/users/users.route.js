import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function userRoutes(controller) {
  const router = Router();
  router.get('/', roles('LANDLORD'), controller.list);
  router.post('/', roles('LANDLORD'), controller.create);
  router.patch('/:id/status', roles('LANDLORD'), controller.setStatus);
  router.get('/:id', roles('LANDLORD'), controller.detail);
  return router;
}
