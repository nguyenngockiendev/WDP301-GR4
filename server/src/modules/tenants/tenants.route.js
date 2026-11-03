import { Router } from 'express';
import * as tenantsController from './tenants.controller.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { requirePropertyManager, requireTenantManagerAccess } from '../../shared/middlewares/property-access.middleware.js';

const router = Router();

router.get('/property/:propertyId', requireAuth, requireRole('landlord', 'manager'), requirePropertyManager, tenantsController.getTenantsByProperty);
router.get('/search/:propertyId', requireAuth, requireRole('landlord', 'manager'), requirePropertyManager, tenantsController.searchTenants);
router.get('/:tenantId', requireAuth, requireRole('landlord', 'manager'), requireTenantManagerAccess, tenantsController.getTenantById);

export default router;
