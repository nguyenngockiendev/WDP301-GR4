import { timingSafeEqual } from 'node:crypto';
import { SePayPgClient } from 'sepay-pg-node';

export const createSepayCheckout = ({ paymentCode, amount }) => {
  const merchantId = process.env.SEPAY_MERCHANT_ID;
  const secretKey = process.env.SEPAY_SECRET_KEY;
  const backendUrl = process.env.SEPAY_PUBLIC_BACKEND_URL;
  if (!merchantId || !secretKey || secretKey.startsWith('spsk_live_')) {
    throw { status: 503, message: 'Chưa cấu hình đầy đủ SePay Sandbox trong backend!' };
  }

  const fields = {
    order_amount: amount,
    merchant: merchantId,
    currency: 'VND',
    operation: 'PURCHASE',
    order_description: `Thanh toan hoa don ${paymentCode}`,
    order_invoice_number: paymentCode,
    payment_method: 'BANK_TRANSFER',
  };

  if (backendUrl) {
    if (!URL.canParse(backendUrl)) {
      throw { status: 503, message: 'SEPAY_PUBLIC_BACKEND_URL cần là địa chỉ HTTPS công khai!' };
    }
    const backend = new URL(backendUrl);
    if (backend.protocol !== 'https:' || backend.username || backend.password) {
      throw { status: 503, message: 'SEPAY_PUBLIC_BACKEND_URL cần là địa chỉ HTTPS công khai!' };
    }
    const callbackUrl = new URL(`/api/payments/sepay/return/${paymentCode}/`, backend);
    fields.success_url = new URL('success', callbackUrl).href;
    fields.error_url = new URL('error', callbackUrl).href;
    fields.cancel_url = new URL('cancel', callbackUrl).href;
  }

  const client = new SePayPgClient({ env: 'sandbox', merchant_id: merchantId, secret_key: secretKey });
  const checkoutURL = client.checkout.initCheckoutUrl();
  const checkoutFormfields = client.checkout.initOneTimePaymentFields(fields);

  return { checkoutURL, checkoutFormfields };
};

export function verifySepayIpnKey(key) {
  const expectedKey = process.env.SEPAY_IPN_SECRET_KEY;
  if (!expectedKey) throw { status: 503, message: 'Chưa cấu hình khóa IPN SePay!' };
  if (!key) return false;

  const received = Buffer.from(key);
  const expected = Buffer.from(expectedKey);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
