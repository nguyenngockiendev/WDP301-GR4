import { Router } from 'express';
import * as roomsController from './rooms.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { validateCreateRoom, validateUpdateRoom, validateUpdateRoomStatus } from './rooms.validation.js';

const router = Router();

router.get('/search', roomsController.searchAvailableRooms);
router.get('/property/:propertyId', roomsController.getRoomsByProperty);
router.get('/:roomId', roomsController.getRoomById);
router.post('/', validate(validateCreateRoom), roomsController.createRoom);
router.put('/:roomId', validate(validateUpdateRoom), roomsController.updateRoom);
router.patch('/:roomId/status', validate(validateUpdateRoomStatus), roomsController.updateRoomStatus);
router.patch('/:roomId/deactivate', roomsController.deactivateRoom);

export default router;
