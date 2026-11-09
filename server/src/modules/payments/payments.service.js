import mongoose from 'mongoose';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';
import { getInvoiceForPayment } from '../invoices/invoices.service.js';
import { isValidPaymentAmount } from './payments.validation.js';
import { createVnpayPaymentUrl } from './vnpay.service.js';
import { createSepayCheckout } from './sepay.service.js';

const payableStatuses = ['unpaid', 'partially_paid', 'overdue'];

async function getPendingPayment(invoice, userId, amount, returnOrigin, provider, session) {
  const now = new Date();
  await Payments.updateMany(
    { invoice: invoice._id, method: 'gateway', status: 'pending' },
    { status: 'cancelled' },
    { session },
  );

  const [payment] = await Payments.create([
    {
      invoice: invoice._id,
      method: 'gateway',
      status: 'pending',
      provider,
      payer: userId,
      amount,
      paidAt: null,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      returnOrigin,
    },
  ], { session });

  return payment;
}

export const createInvoicePayment = async (data, userId, provider = 'vnpay') => {
  await Payments.init();
  return mongoose.connection.transaction(async session => {
    const invoice = await getInvoiceForPayment(data, userId, session);
    const paidAmount = invoice.paidAmount ?? 0;
    const amount = invoice.totalAmount - paidAmount;
    if (!payableStatuses.includes(invoice.status) || amount <= 0) {
      throw { status: 409, message: 'Hóa đơn không còn khoản cần thanh toán!' };
    }
    if (!Number.isSafeInteger(paidAmount) || paidAmount < 0 || !isValidPaymentAmount(amount)) {
      throw { status: 400, message: 'Số tiền còn phải trả không hợp lệ!' };
    }

    // Cùng cập nhật bản ghi hóa đơn để tránh tạo link mới lúc IPN đang ghi nhận thanh toán.
    await Invoices.updateOne({ _id: invoice._id }, { $inc: { __v: 1 } }, { session, timestamps: false });
    const payment = await getPendingPayment(invoice, userId, amount, data.returnOrigin, provider, session);
    const paymentCode = payment.id;
    if (provider === 'sepay') {
      const checkout = createSepayCheckout({ paymentCode, amount });
      return { invoiceId: invoice._id, paymentCode, amount, ...checkout };
    }
    const paymentUrl = createVnpayPaymentUrl({
      paymentCode,
      amount,
      ipAddress: data.ipAddress,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
    });
    return { invoiceId: invoice._id, paymentCode, amount, paymentUrl };
  });
};

export const findGatewayPayment = (paymentCode, provider) => {
  if (!mongoose.isObjectIdOrHexString(paymentCode)) return null;
  const filter = { _id: paymentCode, method: 'gateway', expiresAt: { $type: 'date' } };
  if (provider === 'vnpay') filter.provider = { $in: ['vnpay', null] };
  if (provider === 'sepay') filter.provider = 'sepay';
  return Payments.findOne(filter);
};

export const getPaymentStatus = async (paymentCode, userId) => {
  const query = findGatewayPayment(paymentCode);
  const payment = query && await query.where('payer').equals(userId).populate('invoice', 'status').lean();
  if (!payment) throw { status: 404, message: 'Không tìm thấy giao dịch thanh toán của bạn!' };
  return {
    status: payment.status,
    invoiceId: payment.invoice?._id,
    invoiceStatus: payment.invoice?.status,
    amount: payment.amount,
  };
};

export const confirmGatewayPayment = async (result, provider) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const query = findGatewayPayment(result.paymentCode, provider);
      const payment = query && await query.session(session);
      if (!payment) return '01';
      if (payment.amount !== result.amount) return '04';
      if (['success', 'failed'].includes(payment.status)) return '02';

      if (!result.success) {
        payment.status = 'failed';
        await payment.save({ session });
        return '00';
      }

      const invoice = await Invoices.findById(payment.invoice).session(session);
      if (!invoice) return '01';
      const paidAmount = invoice.paidAmount ?? 0;
      const balance = invoice.totalAmount - paidAmount;
      const validTransactionId = provider === 'vnpay'
        ? /^[1-9]\d*$/.test(result.gatewayTransactionId || '')
        : Boolean(result.gatewayTransactionId);
      if (!validTransactionId ||
        !payableStatuses.includes(invoice.status) || !Number.isSafeInteger(balance) || balance < payment.amount) {
        return '99';
      }

      invoice.paidAmount = paidAmount + payment.amount;
      invoice.status = invoice.paidAmount === invoice.totalAmount ? 'paid' : 'partially_paid';
      payment.status = 'success';
      payment.paidAt = new Date();
      payment.gatewayTransactionId = result.gatewayTransactionId;
      await invoice.save({ session });
      await payment.save({ session });
      return '00';
    });
  } finally {
    await session.endSession();
  }
};
