import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { createLimiter } from '../../shared/middlewares/middlewave.js';
import { getUtilityReadings, saveUtilityReadings } from './utility-readings.controller.js';

const router = Router();

router.use(requireAuth, requireRole('landlord', 'manager'));
router.get('/', getUtilityReadings);
router.post('/', createLimiter(10, 5, true), saveUtilityReadings);

export default router;
