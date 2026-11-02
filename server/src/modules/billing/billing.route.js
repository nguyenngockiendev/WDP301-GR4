import { Router } from 'express';
import { roles } from '../../shared/middlewares/security.js';

export default function billingRoutes(controller) {
  const router = Router();
  router.use(roles('LANDLORD', 'MANAGER'));
  router.post('/readings', controller.reading);
  router.post('/invoices', controller.invoice);
  return router;
}
