import { Router } from 'express';
import * as rentalRequestsController from './rentalrequests.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  validateCreateRentalRequest,
  validateProcessRentalRequest,
} from './rentalrequests.validation.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import {
  requirePropertyManager,
  requireRentalRequestAccess,
  requireRentalRequestManager,
} from '../../shared/middlewares/property-access.middleware.js';

const router = Router();

router.get('/property/:propertyId', requireAuth, requireRole('landlord', 'manager'), requirePropertyManager, rentalRequestsController.getRentalRequestsByProperty);
router.get('/pending/:propertyId', requireAuth, requireRole('landlord', 'manager'), requirePropertyManager, rentalRequestsController.getPendingRequests);
router.get('/:requestId', requireAuth, requireRentalRequestAccess, rentalRequestsController.getRentalRequestById);
router.post('/', requireAuth, requireRole('tenant'), validate(validateCreateRentalRequest), rentalRequestsController.createRentalRequest);
router.patch('/:requestId/process', requireAuth, requireRole('landlord', 'manager'), requireRentalRequestManager, validate(validateProcessRentalRequest), rentalRequestsController.processRentalRequest);

export default router;
