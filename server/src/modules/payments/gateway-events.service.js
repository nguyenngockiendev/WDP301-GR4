import GatewayEvents from '../../models/GatewayEvents.js';
import { readVnpayResult } from './vnpay.service.js';
import { isValidVnpayResult } from './payments.validation.js';
import { confirmGatewayPayment } from './payments.service.js';

const callbackFields = [
  'vnp_TxnRef',
  'vnp_TransactionNo',
  'vnp_Amount',
  'vnp_ResponseCode',
  'vnp_TransactionStatus',
  'vnp_TmnCode',
  'vnp_BankCode',
  'vnp_BankTranNo',
  'vnp_CardType',
  'vnp_PayDate',
  'vnp_OrderInfo',
  'vnp_SecureHash',
  'vnp_SecureHashType',
  'vnp_PromotionCode',
  'vnp_PromotionAmount',
];
const processResults = {
  '00': 'APPLIED',
  '01': 'ORDER_NOT_FOUND',
  '02': 'DUPLICATE',
  '04': 'AMOUNT_MISMATCH',
  99: 'ERROR',
};

export const processVnpayCallback = async (query, source) => {
  // Chỉ lưu trường callback VNPay, không lưu token, cookie, headers hoặc khóa cấu hình.
  const raw = {};
  let rawTruncated = false;
  for (const field of callbackFields) {
    if (query[field] === undefined) continue;
    const value = typeof query[field] === 'string' ? query[field] : JSON.stringify(query[field]);
    raw[field] = value.slice(0, 1000);
    if (value.length > 1000) rawTruncated = true;
  }
  const amountText = typeof query.vnp_Amount === 'string' ? query.vnp_Amount : '';
  const amount = /^\d{1,12}$/.test(amountText) ? Number(amountText) / 100 : null;
  // Mỗi lượt gọi có một bản ghi riêng; callback lặp vẫn cần nhật ký.
  const event = await GatewayEvents.create({
    source,
    raw,
    rawTruncated,
    txnRef: typeof query.vnp_TxnRef === 'string' ? query.vnp_TxnRef.slice(0, 100) : undefined,
    gatewayTransactionNo:
      typeof query.vnp_TransactionNo === 'string'
        ? query.vnp_TransactionNo.slice(0, 100)
        : undefined,
    amount,
    responseCode: raw.vnp_ResponseCode?.slice(0, 10),
    transactionStatus: raw.vnp_TransactionStatus?.slice(0, 10),
  });
  try {
    const params = Object.fromEntries(
      Object.entries(query).filter(([key]) => key.startsWith('vnp_')),
    );
    if (!isValidVnpayResult(params)) {
      event.processResult = 'INVALID_PAYLOAD';
      event.resultCode = '97';
      event.processedAt = new Date();
      await event.save();
      return { result: null, code: '97' };
    }
    const result = readVnpayResult(query, source === 'IPN');
    event.signatureValid = Boolean(result);
    if (!result) {
      event.processResult = 'INVALID_SIGNATURE';
      event.resultCode = '97';
      event.processedAt = new Date();
      await event.save();
      return { result: null, code: '97' };
    }
    event.processResult = 'PROCESSING';
    await event.save();
    const code = await confirmGatewayPayment(result);
    event.processResult = processResults[code] || 'ERROR';
    event.resultCode = code;
    event.processedAt = new Date();
    await event.save();
    return { result, code };
  } catch (error) {
    // Nếu DB tạm mất kết nối, bản RECEIVED/PROCESSING còn lại cho lần kiểm tra sau.
    try {
      await GatewayEvents.updateOne(
        { _id: event._id },
        { $set: { processResult: 'ERROR', processedAt: new Date() } },
      );
    } catch {
      console.error('[GatewayEvent] Chưa lưu được kết quả xử lý', String(event._id));
    }
    throw error;
  }
};
