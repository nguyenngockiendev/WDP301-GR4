import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import * as reportsController from './reports.controller.js';
const router = Router();
router.get('/', requireAuth, reportsController.getReports);
export default router;
