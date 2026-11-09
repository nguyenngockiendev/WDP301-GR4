import { VNPay, ignoreLogger } from 'vnpay';
import { isValidVnpayResult } from './payments.validation.js';

function getVnpay() {
  const tmnCode = process.env.VNP_TMNCODE;
  const secureSecret = process.env.VNP_HASH_SECRET;
  if (!tmnCode || !secureSecret) throw new Error('Thiếu cấu hình VNPay Sandbox!');

  return new VNPay({
    tmnCode,
    secureSecret,
    testMode: true,
    hashAlgorithm: 'SHA512',
    loggerFn: ignoreLogger,
  });
}

function formatVnpayDate(date) {
  const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return Number(vietnamTime.toISOString().slice(0, 19).replace(/\D/g, ''));
}

export const createVnpayPaymentUrl = ({ paymentCode, amount, ipAddress, createdAt, expiresAt }) => {
  const returnUrl = process.env.VNP_RETURN_URL;
  if (!returnUrl) throw new Error('Thiếu VNP_RETURN_URL!');

  const start = createdAt ?? new Date();
  const expiry = expiresAt ?? new Date(start.getTime() + 15 * 60 * 1000);
  if (!(expiry instanceof Date) || !Number.isFinite(expiry.getTime()) || expiry <= Date.now()) {
    throw new Error('Thời gian hết hạn VNPay không hợp lệ!');
  }

  return getVnpay().buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_TxnRef: paymentCode,
    vnp_OrderInfo: `Thanh toan cho ma GD:${paymentCode}`,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: returnUrl,
    vnp_CreateDate: formatVnpayDate(start),
    vnp_ExpireDate: formatVnpayDate(expiry),
  });
};

export const readVnpayResult = (query, isIpn = false) => {
  const params = Object.fromEntries(
    Object.entries(query).filter(([key]) => key.startsWith('vnp_')),
  );
  if (!isValidVnpayResult(params)) return null;

  params.vnp_SecureHash = params.vnp_SecureHash.toLowerCase();
  const vnpay = getVnpay();
  const result = isIpn ? vnpay.verifyIpnCall(params) : vnpay.verifyReturnUrl(params);
  if (!result.isVerified || result.vnp_TmnCode !== process.env.VNP_TMNCODE) return null;

  return {
    paymentCode: result.vnp_TxnRef,
    amount: result.vnp_Amount,
    responseCode: result.vnp_ResponseCode,
    transactionStatus: result.vnp_TransactionStatus,
    gatewayTransactionId: result.vnp_TransactionNo || null,
    success: result.isSuccess && result.vnp_TransactionStatus === '00',
  };
};
