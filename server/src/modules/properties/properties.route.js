import { Router } from 'express';
import * as propertiesController from './properties.controller.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';

const router = Router();

// Nhà trọ của user đang đăng nhập (landlord: sở hữu, manager: được giao)
router.get('/my', authMiddleware, checkRole('landlord', 'manager'), propertiesController.getMyProperties);

export default router;
