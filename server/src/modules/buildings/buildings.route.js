import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function buildingRoutes(controller) {
  const router = Router();
  router.use(roles('LANDLORD'));
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.detail);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  router.patch('/:id/manager', controller.assignManager);
  router.patch('/:id/status', controller.setStatus);
  return router;
}
