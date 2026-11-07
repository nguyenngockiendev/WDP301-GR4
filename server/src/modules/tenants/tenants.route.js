import { Router } from 'express';
import * as tenantsController from './tenants.controller.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';

const router = Router();

// Chỉ chủ trọ (landlord) và quản lý (manager) xem được người thuê của nhà trọ mình
router.use(authMiddleware, checkRole('landlord', 'manager'));

router.get('/property/:propertyId', tenantsController.getTenantsByProperty);
router.get('/search/:propertyId', tenantsController.searchTenants);
router.get('/:tenantId', tenantsController.getTenantById);

export default router;
