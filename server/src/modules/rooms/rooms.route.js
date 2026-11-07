import { Router } from 'express';
import * as roomsController from './rooms.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { requirePropertyManager } from '../../shared/middlewares/property-access.middleware.js';
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateUpdateRoomStatus,
} from './rooms.validation.js';

const router = Router();

// Mọi API phòng đều yêu cầu đăng nhập
router.use(requireAuth);

// Chỉ chủ trọ (landlord) và quản lý (manager) được quản lý phòng.
const requireRoomManagementRole = requireRole('landlord', 'manager');

// Mọi user đã đăng nhập (kể cả tenant) được tìm phòng trống và xem chi tiết phòng
router.get('/search', roomsController.searchAvailableRooms);
router.get(
  '/property/:propertyId',
  requireRoomManagementRole,
  requirePropertyManager,
  roomsController.getRoomsByProperty,
);
router.get('/:roomId', roomsController.getRoomById);
router.post(
  '/',
  requireRoomManagementRole,
  requirePropertyManager,
  validate(validateCreateRoom),
  roomsController.createRoom,
);
router.put(
  '/:roomId',
  requireRoomManagementRole,
  requirePropertyManager,
  validate(validateUpdateRoom),
  roomsController.updateRoom,
);
router.patch(
  '/:roomId/status',
  requireRoomManagementRole,
  requirePropertyManager,
  validate(validateUpdateRoomStatus),
  roomsController.updateRoomStatus,
);
router.patch(
  '/:roomId/deactivate',
  requireRoomManagementRole,
  requirePropertyManager,
  roomsController.deactivateRoom,
);

export default router;
