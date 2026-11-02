import { Router } from 'express';
import * as tenantsController from './tenants.controller.js';

const router = Router();

router.get('/property/:propertyId', tenantsController.getTenantsByProperty);
router.get('/search/:propertyId', tenantsController.searchTenants);
router.get('/:tenantId', tenantsController.getTenantById);

export default router;
