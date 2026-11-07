import { Router } from 'express';
import * as rentalRequestsController from './rentalrequests.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import {
  validateCreateRentalRequest,
  validateProcessRentalRequest,
} from './rentalrequests.validation.js';

const router = Router();

router.use(authMiddleware);

const requirePropertyManager = checkRole('landlord', 'manager');

router.get('/property/:propertyId', requirePropertyManager, rentalRequestsController.getRentalRequestsByProperty);
router.get('/pending/:propertyId', requirePropertyManager, rentalRequestsController.getPendingRequests);
router.get('/:requestId', requirePropertyManager, rentalRequestsController.getRentalRequestById);
router.post('/', checkRole('tenant'), validate(validateCreateRentalRequest), rentalRequestsController.createRentalRequest);
router.patch('/:requestId/process', requirePropertyManager, validate(validateProcessRentalRequest), rentalRequestsController.processRentalRequest);

export default router;
