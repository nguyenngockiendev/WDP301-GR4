import { Router } from 'express';
import * as contractsController from './contracts.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import {
  validateCreateContract,
  validateUpdateContract,
  validateRenewContract,
  validateChangeRepresentative,
} from './contracts.validation.js';

const router = Router();

// Chỉ chủ trọ (landlord) và quản lý (manager) được quản lý hợp đồng.
// Quyền với từng nhà trọ được kiểm tra trong service (assertPropertyAccess).
router.use(authMiddleware, checkRole('landlord', 'manager'));

router.get('/search', contractsController.searchContracts);
router.get('/property/:propertyId', contractsController.getContractsByProperty);
router.get('/property/:propertyId/form-options', contractsController.getContractFormOptions);
router.get('/:contractId', contractsController.getContractById);
router.post('/', validate(validateCreateContract), contractsController.createContract);
router.put('/:contractId', validate(validateUpdateContract), contractsController.updateContract);
router.patch('/:contractId/renew', validate(validateRenewContract), contractsController.renewContract);
router.patch('/:contractId/change-representative', validate(validateChangeRepresentative), contractsController.changeRepresentative);

export default router;
