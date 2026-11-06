import { Router } from 'express';
import * as assignmentsController from './managerassignments.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';

const router = Router();

// Chỉ chủ trọ (landlord) được giao / gỡ quản lý cho nhà trọ của mình
router.use(authMiddleware, checkRole('landlord'));

const validateAssign = body => {
  if (!body?.property || String(body.property).trim().length === 0) return 'Vui lòng chọn nhà trọ';
  if (!body?.manager || String(body.manager).trim().length === 0) return 'Vui lòng chọn quản lý';
  return null;
};

router.get('/', assignmentsController.getAssignments);
router.get('/available-managers', assignmentsController.getAvailableManagers);
router.post('/', validate(validateAssign), assignmentsController.assignManager);
router.patch('/:assignmentId/remove', assignmentsController.removeAssignment);

export default router;
