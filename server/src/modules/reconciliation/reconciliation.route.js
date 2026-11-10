import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { getReconciliation } from './reconciliation.controller.js';

const router = Router();

router.get('/', requireAuth, getReconciliation);

export default router;
