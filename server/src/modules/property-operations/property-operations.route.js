import { Router } from 'express';
import * as controller from './property-operations.controller.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { requirePropertyManager } from '../../shared/middlewares/property-access.middleware.js';

const router = Router();
router.use(requireAuth, requireRole('landlord', 'manager'));
router.get('/properties/:propertyId/assets', requirePropertyManager, controller.listAssets);
router.get('/properties/:propertyId/rooms', requirePropertyManager, controller.listRooms);
router.post('/properties/:propertyId/assets', requirePropertyManager, controller.createAsset);
router.put('/properties/:propertyId/assets/:assetId', requirePropertyManager, controller.updateAsset);
router.get('/properties/:propertyId/maintenance', requirePropertyManager, controller.listMaintenance);
router.post('/properties/:propertyId/maintenance', requirePropertyManager, controller.createMaintenance);
router.patch('/properties/:propertyId/maintenance/:ticketId', requirePropertyManager, controller.updateMaintenance);

export default router;
