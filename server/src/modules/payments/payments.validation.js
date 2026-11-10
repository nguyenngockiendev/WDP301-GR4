import mongoose from 'mongoose';

const paymentCodePattern = /^[a-z0-9]{1,100}$/i;
const maxPaymentAmount = 9999999999;

export function isValidPaymentAmount(amount) {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= maxPaymentAmount;
}

export function validateCreateVnpayPayment(body) {
  const { paymentCode, amount } = body || {};
  if (typeof paymentCode !== 'string' || !paymentCodePattern.test(paymentCode)) {
    return 'Mã giao dịch VNPay không hợp lệ!';
  }
  if (!isValidPaymentAmount(amount)) {
    return 'Số tiền thanh toán VNPay không hợp lệ!';
  }
  return null;
}

export function validateInvoicePayment(body) {
  if (typeof body?.roomId !== 'string' || !mongoose.isObjectIdOrHexString(body.roomId)) {
    return 'Mã phòng không hợp lệ!';
  }
  if (typeof body.invoiceId !== 'string' || !mongoose.isObjectIdOrHexString(body.invoiceId)) {
    return 'Mã hóa đơn không hợp lệ!';
  }
  return null;
}

export function isValidVnpayResult(params) {
  if (!Object.values(params).every(value => typeof value === 'string')) return false;

  return (
    /^[a-f0-9]{128}$/i.test(params.vnp_SecureHash || '') &&
    paymentCodePattern.test(params.vnp_TxnRef || '') &&
    /^\d{1,10}00$/.test(params.vnp_Amount || '') && Number(params.vnp_Amount) > 0 &&
    /^\d{2}$/.test(params.vnp_ResponseCode || '') &&
    /^\d{2}$/.test(params.vnp_TransactionStatus || '')
  );
}
