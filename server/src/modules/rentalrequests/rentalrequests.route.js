import { Router } from 'express';
import * as rentalRequestsController from './rentalrequests.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import {
  validateCreateRentalRequest,
  validateProcessRentalRequest,
} from './rentalrequests.validation.js';

const router = Router();

const staffOnly = [authMiddleware, checkRole('landlord', 'manager')];

// Người thuê gửi yêu cầu: tenant lấy từ token, không tin body
const setTenantFromToken = (req, _res, next) => {
  req.body = { ...req.body, tenant: req.user.userId };
  next();
};

router.get('/property/:propertyId', staffOnly, rentalRequestsController.getRentalRequestsByProperty);
router.get('/pending/:propertyId', staffOnly, rentalRequestsController.getPendingRequests);
router.get('/:requestId', staffOnly, rentalRequestsController.getRentalRequestById);
router.post(
  '/',
  authMiddleware,
  checkRole('tenant'),
  setTenantFromToken,
  validate(validateCreateRentalRequest),
  rentalRequestsController.createRentalRequest,
);
router.patch(
  '/:requestId/process',
  staffOnly,
  validate(validateProcessRentalRequest),
  rentalRequestsController.processRentalRequest,
);

export default router;
