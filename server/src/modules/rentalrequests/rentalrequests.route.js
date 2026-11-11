import { Router } from 'express';
import * as rentalRequestsController from './rentalrequests.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import {
  validateCreateRentalRequest,
  validateCreateGuestRentalRequest,
  validateCreateTenantAccount,
  validateProcessRentalRequest,
} from './rentalrequests.validation.js';

const router = Router();

router.post('/guest', validate(validateCreateGuestRentalRequest), rentalRequestsController.createGuestRentalRequest);

router.use(authMiddleware);

const requirePropertyManager = checkRole('landlord', 'manager');

router.get('/property/:propertyId', requirePropertyManager, rentalRequestsController.getRentalRequestsByProperty);
router.get('/pending/:propertyId', requirePropertyManager, rentalRequestsController.getPendingRequests);
router.get('/:requestId', requirePropertyManager, rentalRequestsController.getRentalRequestById);
router.post('/:requestId/create-tenant-account', checkRole('manager'), validate(validateCreateTenantAccount), rentalRequestsController.createTenantAccountForRequest);
router.post('/', checkRole('tenant'), validate(validateCreateRentalRequest), rentalRequestsController.createRentalRequest);
router.patch('/:requestId/process', checkRole('manager'), validate(validateProcessRentalRequest), rentalRequestsController.processRentalRequest);

export default router;
