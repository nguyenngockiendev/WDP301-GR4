import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';
import { createLimiter } from '../../shared/middlewares/middlewave.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  createInvoicePayment,
  getPaymentStatus,
  vnpayIpn,
  vnpayReturn,
} from './payments.controller.js';
import { validateInvoicePayment } from './payments.validation.js';

const router = Router();

router.post(
  '/vnpay/invoice',
  requireAuth,
  requireRole('tenant'),
  createLimiter(10, 5, true),
  validate(validateInvoicePayment),
  createInvoicePayment,
);
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIpn);
router.get('/vnpay/status/:paymentCode', requireAuth, requireRole('tenant'), getPaymentStatus);
router.get('/status/:paymentCode', requireAuth, requireRole('tenant'), getPaymentStatus);

export default router;
