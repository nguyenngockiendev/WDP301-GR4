import mongoose from 'mongoose';

const paymentCodePattern = /^[a-z0-9]{1,100}$/i;
const maxPaymentAmount = 9999999999;

export function isValidPaymentAmount(amount) {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= maxPaymentAmount;
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
    /^\d{1,10}00$/.test(params.vnp_Amount || '') &&
    Number(params.vnp_Amount) > 0 &&
    /^\d{2}$/.test(params.vnp_ResponseCode || '') &&
    /^\d{2}$/.test(params.vnp_TransactionStatus || '')
  );
}

export function readSepayPaidResult(body) {
  const { order, transaction } = body || {};
  if (
    body?.notification_type !== 'ORDER_PAID' ||
    order?.order_status !== 'CAPTURED' ||
    order?.order_currency !== 'VND' ||
    transaction?.transaction_status !== 'APPROVED' ||
    transaction?.transaction_type !== 'PAYMENT' ||
    transaction?.transaction_currency !== 'VND'
  )
    return null;

  const paymentCode = order.order_invoice_number;
  const gatewayTransactionId = transaction.transaction_id;
  const orderAmount = String(order.order_amount);
  const transactionAmount = String(transaction.transaction_amount);
  const wholeVnd = /^\d+(?:\.0+)?$/;
  const amount = Number(orderAmount);
  if (
    typeof paymentCode !== 'string' ||
    !mongoose.isObjectIdOrHexString(paymentCode) ||
    typeof gatewayTransactionId !== 'string' ||
    !/^[a-z0-9-]{1,128}$/i.test(gatewayTransactionId) ||
    !wholeVnd.test(orderAmount) ||
    !wholeVnd.test(transactionAmount) ||
    !isValidPaymentAmount(amount) ||
    Number(transactionAmount) !== amount
  )
    return null;

  return { paymentCode, amount, gatewayTransactionId, success: true };
}
