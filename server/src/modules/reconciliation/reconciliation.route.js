import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { getReconciliation, syncPayment } from './reconciliation.controller.js';

const router = Router();

router.get('/', requireAuth, getReconciliation);
router.post('/payments/:paymentId/sync', requireAuth, syncPayment);

export default router;
