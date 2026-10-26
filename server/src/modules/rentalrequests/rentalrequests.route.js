import { Router } from 'express';
import * as rentalRequestsController from './rentalrequests.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  validateCreateRentalRequest,
  validateProcessRentalRequest,
} from './rentalrequests.validation.js';

const router = Router();

router.get('/property/:propertyId', rentalRequestsController.getRentalRequestsByProperty);
router.get('/pending/:propertyId', rentalRequestsController.getPendingRequests);
router.get('/:requestId', rentalRequestsController.getRentalRequestById);
router.post('/', validate(validateCreateRentalRequest), rentalRequestsController.createRentalRequest);
router.patch('/:requestId/process', validate(validateProcessRentalRequest), rentalRequestsController.processRentalRequest);

export default router;
