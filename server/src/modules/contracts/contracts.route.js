import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function contractRoutes(controller) {
  const router = Router();
  router.get('/options', roles('LANDLORD'), controller.options);
  router.post('/', roles('LANDLORD'), controller.create);
  return router;
}
