import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function roomRoutes(controller) {
  const router = Router();
  router.use(roles('LANDLORD', 'MANAGER'));
  router.get('/', controller.list);
  router.post('/', roles('LANDLORD'), controller.create);
  router.post('/bulk', roles('LANDLORD'), controller.createMany);
  router.get('/:id', controller.detail);
  router.get('/:id/rent-rates', controller.rentRates);
  router.patch('/:id/manager', roles('LANDLORD'), controller.assign);
  router.patch('/:id/building', roles('LANDLORD'), controller.assignBuilding);
  router.patch('/:id/price', roles('LANDLORD'), controller.updatePrice);
  return router;
}
