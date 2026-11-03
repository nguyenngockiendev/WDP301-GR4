import { Router } from 'express';
import { getAssignedProperties } from './manager.controller.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';

const router = Router();
router.use(requireAuth, requireRole('manager'));
router.get('/properties', getAssignedProperties);

export default router;
