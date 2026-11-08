import { Router } from 'express';
import * as templatesController from './contracttemplates.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { authMiddleware, checkRole } from '../../shared/middlewares/middlewave.js';
import {
  validateCreateTemplate,
  validateUpdateTemplate,
  validateTemplateStatus,
} from './contracttemplates.validation.js';

const router = Router();

// Landlord và manager được xem mẫu; chỉ landlord được tạo / sửa / ẩn mẫu.
router.use(authMiddleware, checkRole('landlord', 'manager'));

const landlordOnly = checkRole('landlord');

router.get('/', templatesController.getTemplates);
router.get('/placeholders', templatesController.getPlaceholders);
router.get('/:templateId', templatesController.getTemplateById);
router.post('/', landlordOnly, validate(validateCreateTemplate), templatesController.createTemplate);
router.put('/:templateId', landlordOnly, validate(validateUpdateTemplate), templatesController.updateTemplate);
router.patch('/:templateId/status', landlordOnly, validate(validateTemplateStatus), templatesController.updateTemplateStatus);

export default router;
