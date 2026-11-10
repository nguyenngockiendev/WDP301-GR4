import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();
router.get('/', requireAuth, dashboardController.getDashboard);
export default router;
