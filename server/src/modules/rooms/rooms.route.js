import { Router } from 'express';
import * as roomsController from './rooms.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import { validateCreateRoom, validateUpdateRoom, validateUpdateRoomStatus } from './rooms.validation.js';

const router = Router();

// Chỉ chủ trọ (landlord) và quản lý (manager) được quản lý phòng.
// Quyền với từng nhà trọ được kiểm tra trong service (assertPropertyAccess).
const requirePropertyManager = checkRole('landlord', 'manager');
const requireLandlord = checkRole('landlord');

// Khách chưa đăng nhập được tìm phòng trống và xem chi tiết công khai.
router.get('/search', roomsController.searchAvailableRooms);
router.get('/:roomId', roomsController.getRoomById);

router.use(authMiddleware);
router.get('/property/:propertyId', requirePropertyManager, roomsController.getRoomsByProperty);
router.post('/', requireLandlord, validate(validateCreateRoom), roomsController.createRoom);
router.put('/:roomId', requireLandlord, validate(validateUpdateRoom), roomsController.updateRoom);
router.patch('/:roomId/status', requirePropertyManager, validate(validateUpdateRoomStatus), roomsController.updateRoomStatus);
router.patch('/:roomId/deactivate', requirePropertyManager, roomsController.deactivateRoom);

export default router;
