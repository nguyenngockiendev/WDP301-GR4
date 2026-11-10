import mongoose from 'mongoose';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';
import Notifications from '../../models/Notifications.js';
import Contracts from '../../models/Contracts.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Users from '../../models/Users.js';
import { notifyRecipient } from '../notifications/notifications.events.js';
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

  const [payment] = await Payments.create(
    [
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
    ],
    { session },
  );

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
    await Invoices.updateOne(
      { _id: invoice._id },
      { $inc: { __v: 1 } },
      { session, timestamps: false },
    );
    const payment = await getPendingPayment(
      invoice,
      userId,
      amount,
      data.returnOrigin,
      provider,
      session,
    );
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
  const payment =
    query && (await query.where('payer').equals(userId).populate('invoice', 'status').lean());
  if (!payment) throw { status: 404, message: 'Không tìm thấy giao dịch thanh toán của bạn!' };
  return {
    status: payment.status,
    provider: payment.provider || 'vnpay',
    invoiceId: payment.invoice?._id,
    invoiceStatus: payment.invoice?.status,
    amount: payment.amount,
  };
};

export const confirmGatewayPayment = async (result, provider, recoveryUserId = null) => {
  await Notifications.init();
  const session = await mongoose.startSession();
  try {
    let recipients = [];
    const code = await session.withTransaction(async () => {
      recipients = [];
      const query = findGatewayPayment(result.paymentCode, provider);
      const payment = query && (await query.session(session));
      if (!payment) return '01';
      if (payment.amount !== result.amount) return '04';
      if (recoveryUserId) {
        const user = await Users.findById(recoveryUserId).session(session);
        const invoice = await Invoices.findById(payment.invoice).session(session);
        const contract = invoice && (await Contracts.findById(invoice.contract).session(session));
        const room = contract && (await Rooms.findById(contract.room).session(session));
        const assignment =
          room &&
          (await ManagerAssignments.exists({
            manager: recoveryUserId,
            property: room.property,
            status: 'active',
          }).session(session));
        if (user?.role !== 'manager' || user.status !== 'active' || !assignment) {
          throw { status: 403, message: 'Bạn không còn quyền cập nhật giao dịch này.' };
        }
        if (!result.success || provider !== 'vnpay') return '99';
        if (payment.status !== 'success') {
          const paidPayments = await Payments.find({
            invoice: payment.invoice,
            status: 'success',
          }).session(session);
          const received = paidPayments.reduce((sum, item) => sum + item.amount, 0);
          if (received !== (invoice.paidAmount ?? 0)) return '99';
          const duplicate = await Payments.exists({
            _id: { $ne: payment._id },
            method: 'gateway',
            provider: { $in: ['vnpay', null] },
            status: 'success',
            gatewayTransactionId: result.gatewayTransactionId,
          }).session(session);
          if (duplicate) return '99';
        }
      }
      if (payment.status === 'success' || (payment.status === 'failed' && !recoveryUserId))
        return '02';

      if (!result.success) {
        payment.status = 'failed';
        await payment.save({ session });
        return '00';
      }

      const invoice = await Invoices.findById(payment.invoice).session(session);
      if (!invoice) return '01';
      const paidAmount = invoice.paidAmount ?? 0;
      const balance = invoice.totalAmount - paidAmount;
      const validTransactionId =
        provider === 'vnpay'
          ? /^[1-9]\d*$/.test(result.gatewayTransactionId || '')
          : Boolean(result.gatewayTransactionId);
      if (
        !validTransactionId ||
        !payableStatuses.includes(invoice.status) ||
        !Number.isSafeInteger(balance) ||
        balance < payment.amount
      ) {
        return '99';
      }

      invoice.paidAmount = paidAmount + payment.amount;
      invoice.status = invoice.paidAmount === invoice.totalAmount ? 'paid' : 'partially_paid';
      payment.status = 'success';
      payment.paidAt = result.paidAt || new Date();
      payment.gatewayTransactionId = result.gatewayTransactionId;
      if (recoveryUserId) payment.recordedBy = recoveryUserId;
      await invoice.save({ session });
      await payment.save({ session });
      await Notifications.updateOne(
        { eventKey: `payment-success:${payment.id}`, recipient: payment.payer },
        {
          $setOnInsert: {
            type: 'system',
            title: 'Thanh toán thành công',
            content: `Đã ghi nhận ${payment.amount.toLocaleString('vi-VN')} ₫ cho hóa đơn kỳ ${invoice.billingMonth}.`,
            related: { entityType: 'invoice', entityId: invoice._id },
            isRead: false,
          },
        },
        { upsert: true, session },
      );
      recipients.push(payment.payer);
      const contract = await Contracts.findById(invoice.contract)
        .select('room')
        .session(session)
        .lean();
      const room =
        contract &&
        (await Rooms.findById(contract.room).select('property roomNumber').session(session).lean());
      if (room) {
        const managerIds = await ManagerAssignments.distinct('manager', {
          property: room.property,
          status: 'active',
        }).session(session);
        const managers = await Users.find({
          _id: { $in: managerIds },
          role: 'manager',
          status: 'active',
        })
          .select('_id')
          .session(session)
          .lean();
        for (const manager of managers) {
          await Notifications.updateOne(
            { eventKey: `payment-success:${payment.id}`, recipient: manager._id },
            {
              $setOnInsert: {
                type: 'system',
                property: room.property,
                title: 'Đã nhận thanh toán hóa đơn',
                content: `Phòng ${room.roomNumber} đã thanh toán ${payment.amount.toLocaleString('vi-VN')} ₫ cho hóa đơn kỳ ${invoice.billingMonth}.`,
                related: { entityType: 'invoice', entityId: invoice._id },
                isRead: false,
              },
            },
            { upsert: true, session },
          );
          recipients.push(manager._id);
        }
      }
      return '00';
    });
    if (code === '00') for (const recipient of recipients) notifyRecipient(recipient);
    return code;
  } finally {
    await session.endSession();
  }
};
