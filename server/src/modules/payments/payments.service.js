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
import { activateSignedContractIfDue } from '../contracts/contract-signing.service.js';
import { isValidPaymentAmount } from './payments.validation.js';
import { createVnpayPaymentUrl } from './vnpay.service.js';

const payableStatuses = ['unpaid', 'partially_paid', 'overdue'];

async function getPendingPayment(invoice, userId, amount, returnOrigin, session) {
  const now = new Date();
  const pending = { invoice: invoice._id, method: 'gateway', status: 'pending' };
  if (invoice.invoiceType === 'deposit') {
    const existing = await Payments.findOneAndUpdate(
      { ...pending, provider: 'vnpay', payer: userId, amount, expiresAt: { $gt: now } },
      { $set: { returnOrigin } },
      { session, new: true },
    );
    if (existing) return existing;
  }
  await Payments.updateMany(pending, { status: 'cancelled' }, { session });

  const [payment] = await Payments.create(
    [
      {
        invoice: invoice._id,
        method: 'gateway',
        status: 'pending',
        provider: 'vnpay',
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

export const createInvoicePayment = async (data, userId) => {
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
    const payment = await getPendingPayment(invoice, userId, amount, data.returnOrigin, session);
    const paymentCode = payment.id;
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
  return Payments.findOne(filter);
};

export const getPaymentStatus = async (paymentCode, userId) => {
  const query = findGatewayPayment(paymentCode);
  const payment =
    query && (await query.where('payer').equals(userId).populate('invoice', 'status invoiceType contract').lean());
  if (!payment) throw { status: 404, message: 'Không tìm thấy giao dịch thanh toán của bạn!' };
  return {
    status: payment.status,
    provider: payment.provider || 'vnpay',
    invoiceId: payment.invoice?._id,
    invoiceStatus: payment.invoice?.status,
    invoiceType: payment.invoice?.invoiceType,
    contractId: payment.invoice?.contract,
    amount: payment.amount,
  };
};

export const confirmGatewayPayment = async (result, recoveryUserId = null) => {
  await Notifications.init();
  const session = await mongoose.startSession();
  let paidInvoiceId = null;
  let payerId = null;
  let code = '99';
  try {
    let recipients = [];
    let paidDepositContractId = null;
    const code = await session.withTransaction(async () => {
      recipients = [];
      paidDepositContractId = null;
      const query = findGatewayPayment(result.paymentCode, 'vnpay');
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
        if (!result.success) return '99';
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
      const validTransactionId = /^[1-9]\d*$/.test(result.gatewayTransactionId || '');
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
      if (invoice.invoiceType === 'deposit' && invoice.status === 'paid') {
        paidDepositContractId = invoice.contract;
      }
      const invoiceLabel = invoice.invoiceType === 'deposit' ? 'tiền đặt cọc' : `hóa đơn kỳ ${invoice.billingMonth}`;
      await Notifications.updateOne(
        { eventKey: `payment-success:${payment.id}`, recipient: payment.payer },
        {
          $setOnInsert: {
            type: 'system',
            title: 'Thanh toán thành công',
            content: `Đã ghi nhận ${payment.amount.toLocaleString('vi-VN')} ₫ cho ${invoiceLabel}.`,
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
                content: `Phòng ${room.roomNumber} đã thanh toán ${payment.amount.toLocaleString('vi-VN')} ₫ cho ${invoiceLabel}.`,
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
    if (paidDepositContractId) await activateSignedContractIfDue(paidDepositContractId);
    return code;
  } finally {
    await session.endSession();
  }

  // Báo cho Manager checkout khi một hóa đơn thuộc đợt quyết toán được thanh toán.
  // Lỗi gửi notification không được làm gateway/IPN hiểu nhầm giao dịch đã thanh toán là thất bại.
  if (code === '00' && result.success && paidInvoiceId) {
    try {
      const checkoutRequest = await TerminationRequests.findOne({
        'checkoutSettlement.paymentInvoiceIds': paidInvoiceId,
      }).select('_id checkoutSettlement.paymentRequestedBy');
      if (checkoutRequest?.checkoutSettlement?.paymentRequestedBy) {
        await createNotification({
          recipient: checkoutRequest.checkoutSettlement.paymentRequestedBy,
          type: 'checkout_payment_received',
          title: 'Tenant vừa thanh toán công nợ checkout',
          content:
            'Một hóa đơn thuộc yêu cầu trả phòng đã được thanh toán. Vui lòng kiểm tra trạng thái checkout; chỉ hoàn tất sau khi tất cả hóa đơn đã Paid.',
          related: { entityType: 'TerminationRequest', entityId: checkoutRequest._id },
        });
      }
    } catch (notificationError) {
      console.error('Không gửi được thông báo thanh toán checkout:', notificationError.message);
    }
  }

  return code;
};
