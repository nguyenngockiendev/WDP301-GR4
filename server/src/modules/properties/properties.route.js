import { Router } from 'express';
import * as propertiesController from './properties.controller.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';

const router = Router();

// Nhà trọ của user đang đăng nhập (landlord: sở hữu, manager: được giao)
router.get(
  '/my',
  authMiddleware,
  checkRole('landlord', 'manager'),
  propertiesController.getMyProperties,
);

// Nhà trọ + phòng cho trang Home (mọi tài khoản đã đăng nhập, kể cả người thuê)
router.get('/browse', authMiddleware, propertiesController.getBrowseProperties);

export default router;
