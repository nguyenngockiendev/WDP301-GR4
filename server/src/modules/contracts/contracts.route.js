import { Router } from 'express';
import * as contractsController from './contracts.controller.js';
import * as signingController from './contract-signing.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import {
  validateCreateContract,
  validateUpdateContract,
  validateRenewContract,
  validateChangeRepresentative,
} from './contracts.validation.js';

const router = Router();

router.use(authMiddleware);
router.get('/my/signing', checkRole('tenant'), signingController.listMyContracts);
router.get('/:contractId/signing', checkRole('tenant', 'manager', 'landlord'), signingController.getDocument);
router.post('/:contractId/signing/:action', checkRole('tenant', 'manager'), signingController.changeSigning);

// Chỉ chủ trọ (landlord) và quản lý (manager) được quản lý hợp đồng.
// Quyền với từng nhà trọ được kiểm tra trong service (assertPropertyAccess).
router.use(checkRole('landlord', 'manager'));
const requireManager = checkRole('manager');

router.get('/search', contractsController.searchContracts);
router.get('/property/:propertyId', contractsController.getContractsByProperty);
router.get('/property/:propertyId/form-options', contractsController.getContractFormOptions);
router.get('/:contractId/document', contractsController.getContractDocument);
router.get('/:contractId', contractsController.getContractById);
router.post('/', requireManager, validate(validateCreateContract), contractsController.createContract);
router.put('/:contractId', requireManager, validate(validateUpdateContract), contractsController.updateContract);
router.patch('/:contractId/renew', requireManager, validate(validateRenewContract), contractsController.renewContract);
router.patch('/:contractId/change-representative', requireManager, validate(validateChangeRepresentative), contractsController.changeRepresentative);

export default router;
