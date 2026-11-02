import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function settingsRoutes(controller) {
  const router = Router();
  router.use(roles('LANDLORD'));
  router.get('/:kind', controller.list);
  router.post('/:kind', controller.create);
  router.patch('/:kind/:id', controller.update);
  return router;
}
