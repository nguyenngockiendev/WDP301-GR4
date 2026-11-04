import { Router } from 'express';
import * as roomsController from './rooms.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateUpdateRoomStatus,
} from './rooms.validation.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { requirePropertyManager } from '../../shared/middlewares/property-access.middleware.js';

const router = Router();

router.get('/search', roomsController.searchAvailableRooms);
router.get(
  '/property/:propertyId',
  requireAuth,
  requireRole('landlord', 'manager'),
  requirePropertyManager,
  roomsController.getRoomsByProperty
);
router.get('/:roomId', roomsController.getRoomById);
router.post(
  '/',
  requireAuth,
  requireRole('landlord', 'manager'),
  requirePropertyManager,
  validate(validateCreateRoom),
  roomsController.createRoom
);
router.put(
  '/:roomId',
  requireAuth,
  requireRole('landlord', 'manager'),
  requirePropertyManager,
  validate(validateUpdateRoom),
  roomsController.updateRoom
);
router.patch(
  '/:roomId/status',
  requireAuth,
  requireRole('landlord', 'manager'),
  requirePropertyManager,
  validate(validateUpdateRoomStatus),
  roomsController.updateRoomStatus
);
router.patch(
  '/:roomId/deactivate',
  requireAuth,
  requireRole('landlord', 'manager'),
  requirePropertyManager,
  roomsController.deactivateRoom
);

export default router;
