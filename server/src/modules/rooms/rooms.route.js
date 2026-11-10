import { Router } from 'express';
import * as roomsController from './rooms.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import { validateCreateRoom, validateUpdateRoom, validateUpdateRoomStatus } from './rooms.validation.js';

const router = Router();

// Mọi API phòng đều yêu cầu đăng nhập
router.use(authMiddleware);

// Chỉ chủ trọ (landlord) và quản lý (manager) được quản lý phòng.
// Quyền với từng nhà trọ được kiểm tra trong service (assertPropertyAccess).
const requirePropertyManager = checkRole('landlord', 'manager');
const requireLandlord = checkRole('landlord');

// Mọi user đã đăng nhập (kể cả tenant) được tìm phòng trống và xem chi tiết phòng
router.get('/search', roomsController.searchAvailableRooms);
router.get('/property/:propertyId', requirePropertyManager, roomsController.getRoomsByProperty);
router.get('/:roomId', roomsController.getRoomById);
router.post('/', requireLandlord, validate(validateCreateRoom), roomsController.createRoom);
router.put('/:roomId', requireLandlord, validate(validateUpdateRoom), roomsController.updateRoom);
router.patch('/:roomId/status', requirePropertyManager, validate(validateUpdateRoomStatus), roomsController.updateRoomStatus);
router.patch('/:roomId/deactivate', requirePropertyManager, roomsController.deactivateRoom);

export default router;
