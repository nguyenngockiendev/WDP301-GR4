import { Router } from 'express';
import * as contractsController from './contracts.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  validateCreateContract,
  validateUpdateContract,
  validateRenewContract,
  validateChangeRepresentative,
} from './contracts.validation.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import {
  requireContractAccess,
  requireContractManager,
  requirePropertyManager,
} from '../../shared/middlewares/property-access.middleware.js';

const router = Router();

router.get('/search', requireAuth, requireRole('landlord', 'manager'), contractsController.searchContracts);
router.get('/:contractId/occupants', requireAuth, requireRole('landlord', 'manager'), requireContractManager, contractsController.getOccupants);
router.get('/:contractId/co-resident-candidates', requireAuth, requireRole('landlord', 'manager'), requireContractManager, contractsController.listCoResidentCandidates);
router.put('/:contractId/co-residents', requireAuth, requireRole('landlord', 'manager'), requireContractManager, contractsController.setCoResidents);
router.get('/property/:propertyId', requireAuth, requireRole('landlord', 'manager'), requirePropertyManager, contractsController.getContractsByProperty);
router.get('/:contractId', requireAuth, requireContractAccess, contractsController.getContractById);
router.post('/', requireAuth, requireRole('landlord', 'manager'), requirePropertyManager, validate(validateCreateContract), contractsController.createContract);
router.put('/:contractId', requireAuth, requireRole('landlord', 'manager'), requireContractManager, validate(validateUpdateContract), contractsController.updateContract);
router.patch('/:contractId/renew', requireAuth, requireRole('landlord', 'manager'), requireContractManager, validate(validateRenewContract), contractsController.renewContract);
router.patch('/:contractId/change-representative', requireAuth, requireRole('landlord', 'manager'), requireContractManager, validate(validateChangeRepresentative), contractsController.changeRepresentative);

export default router;
