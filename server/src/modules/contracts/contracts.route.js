import { Router } from 'express';
import * as contractsController from './contracts.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  validateCreateContract,
  validateUpdateContract,
  validateRenewContract,
  validateChangeRepresentative,
} from './contracts.validation.js';

const router = Router();

router.get('/search', contractsController.searchContracts);
router.get('/property/:propertyId', contractsController.getContractsByProperty);
router.get('/:contractId', contractsController.getContractById);
router.post('/', validate(validateCreateContract), contractsController.createContract);
router.put('/:contractId', validate(validateUpdateContract), contractsController.updateContract);
router.patch('/:contractId/renew', validate(validateRenewContract), contractsController.renewContract);
router.patch('/:contractId/change-representative', validate(validateChangeRepresentative), contractsController.changeRepresentative);

export default router;
