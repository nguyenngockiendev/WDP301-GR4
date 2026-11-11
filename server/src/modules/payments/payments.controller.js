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
import { processVnpayCallback } from './gateway-events.service.js';

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

export const vnpayReturn = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { result } = await processVnpayCallback(req.query, 'RETURN');
    if (!result) {
      return sendError(res, { status: 400, message: 'Phản hồi từ VNPay không hợp lệ!' });
    }

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
    const { code } = await processVnpayCallback(req.query, 'IPN');
    return res.json(ipnResponses[code]);
  } catch (error) {
    console.error('Lỗi xử lý IPN VNPay:', error.message);
    return res.json(IpnUnknownError);
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
