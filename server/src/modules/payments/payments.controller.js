import {
  InpOrderAlreadyConfirmed,
  IpnFailChecksum,
  IpnInvalidAmount,
  IpnOrderNotFound,
  IpnSuccess,
  IpnUnknownError,
} from 'vnpay';
import { allowedOrigins } from '../../config/origins.config.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import * as paymentsService from './payments.service.js';
import { readSepayPaidResult } from './payments.validation.js';
import { verifySepayIpnKey } from './sepay.service.js';
import { createVnpayPaymentUrl, readVnpayResult } from './vnpay.service.js';

function getIpAddress(req) {
  return req.ip === '::1' ? '127.0.0.1' : req.ip?.replace(/^::ffff:/, '');
}

const ipnResponses = {
  '00': IpnSuccess,
  '01': IpnOrderNotFound,
  '02': InpOrderAlreadyConfirmed,
  '04': IpnInvalidAmount,
  97: IpnFailChecksum,
  99: IpnUnknownError,
};

export const createVnpayPayment = (req, res) => {
  try {
    const { paymentCode, amount } = req.body || {};
    const ipAddress = getIpAddress(req);
    const paymentUrl = createVnpayPaymentUrl({ paymentCode, amount, ipAddress });

    return sendSuccess(res, 200, 'Tạo URL thanh toán VNPay Sandbox thành công!', {
      paymentCode,
      amount,
      paymentUrl,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

function getInvoicePaymentData(req) {
  const origin = req.get('origin');
  return {
    invoiceId: req.body.invoiceId,
    roomId: req.body.roomId,
    ipAddress: getIpAddress(req),
    returnOrigin: allowedOrigins.has(origin)
      ? origin
      : process.env.CLIENT_URL || 'http://127.0.0.1:3000',
  };
}

export const createInvoicePayment = async (req, res) => {
  try {
    const result = await paymentsService.createInvoicePayment(
      getInvoicePaymentData(req),
      req.user.userId,
    );
    return sendSuccess(res, 200, 'Tạo URL thanh toán hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createSepayInvoicePayment = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await paymentsService.createInvoicePayment(
      getInvoicePaymentData(req),
      req.user.userId,
      'sepay',
    );
    return sendSuccess(res, 200, 'Tạo checkout SePay thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const vnpayReturn = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = readVnpayResult(req.query);
    if (!result) {
      return sendError(res, { status: 400, message: 'Phản hồi từ VNPay không hợp lệ!' });
    }

    await paymentsService.confirmGatewayPayment(result, 'vnpay');

    const query = paymentsService.findGatewayPayment(result.paymentCode, 'vnpay');
    const payment = query && (await query.select('amount returnOrigin').lean());
    if (payment) {
      if (payment.amount !== result.amount) {
        return sendError(res, {
          status: 400,
          message: 'Số tiền VNPay trả về không khớp giao dịch!',
        });
      }
      const url = new URL(`/invoices/payment-result/${payment._id}`, payment.returnOrigin);
      return res.redirect(303, url.href);
    }

    const message = result.success
      ? 'VNPay báo giao dịch thành công!'
      : 'VNPay báo giao dịch chưa thành công!';
    return sendSuccess(res, 200, message, result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const vnpayIpn = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = readVnpayResult(req.query, true);
    const code = result ? await paymentsService.confirmGatewayPayment(result, 'vnpay') : '97';
    return res.json(ipnResponses[code]);
  } catch (error) {
    console.error('Lỗi xử lý IPN VNPay:', error.message);
    return res.json(IpnUnknownError);
  }
};

export const sepayReturn = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { paymentCode, outcome } = req.params;
    const query = paymentsService.findGatewayPayment(paymentCode, 'sepay');
    const payment = query && (await query.select('returnOrigin').lean());
    if (!payment || !['success', 'error', 'cancel'].includes(outcome)) {
      return sendError(res, { status: 404, message: 'Không tìm thấy giao dịch SePay!' });
    }
    const url = new URL(`/invoices/payment-result/${payment._id}`, payment.returnOrigin);
    if (outcome !== 'success') url.searchParams.set('checkout', outcome);
    return res.redirect(303, url.href);
  } catch (error) {
    return sendError(res, error);
  }
};

export const sepayIpn = async (req, res) => {
  try {
    if (!verifySepayIpnKey(req.get('X-Secret-Key'))) {
      return sendError(res, { status: 401, message: 'Khóa IPN SePay không hợp lệ!' });
    }
    if (req.body?.notification_type === 'TRANSACTION_VOID') {
      return sendSuccess(res, 200, 'Đã nhận thông báo từ SePay.');
    }
    const result = readSepayPaidResult(req.body);
    if (!result) return sendError(res, { status: 400, message: 'Dữ liệu IPN SePay không hợp lệ!' });

    const code = await paymentsService.confirmGatewayPayment(result, 'sepay');
    if (code === '00' || code === '02')
      return sendSuccess(res, 200, 'Đã ghi nhận giao dịch SePay.');
    if (code === '01')
      return sendError(res, { status: 404, message: 'Không tìm thấy giao dịch SePay!' });
    if (code === '04')
      return sendError(res, { status: 400, message: 'Số tiền SePay trả về không khớp!' });
    return sendError(res, { status: 409, message: 'Cần đối soát giao dịch SePay với hóa đơn!' });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPaymentStatus = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await paymentsService.getPaymentStatus(req.params.paymentCode, req.user.userId);
    return sendSuccess(res, 200, 'Lấy trạng thái thanh toán thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};
