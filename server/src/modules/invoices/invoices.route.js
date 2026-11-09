import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { createLimiter } from '../../shared/middlewares/middlewave.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  createInvoice, getManagedInvoice, getManagedInvoices, getMyInvoice, getMyInvoices, previewInvoice, sendInvoices,
} from './invoices.controller.js';
import { validateManagedInvoiceFilters, validateSendInvoices } from './invoices.validation.js';

const router = Router();

router.use(requireAuth);
router.get('/my', requireRole('tenant'), getMyInvoices);
router.get('/my/:invoiceId', requireRole('tenant'), getMyInvoice);

const requireStaff = requireRole('landlord', 'manager');
router.get('/', requireStaff, validate(validateManagedInvoiceFilters), getManagedInvoices);
router.get('/:invoiceId', requireStaff, getManagedInvoice);
router.post('/preview', requireStaff, previewInvoice);
router.post('/send', requireStaff, createLimiter(10, 5, true), validate(validateSendInvoices), sendInvoices);
router.post('/', requireStaff, createLimiter(10, 5, true), createInvoice);

export default router;
