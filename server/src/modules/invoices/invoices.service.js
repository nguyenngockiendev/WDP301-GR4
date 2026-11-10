import mongoose from 'mongoose';
import Contracts from '../../models/Contracts.js';
import Invoices from '../../models/Invoices.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import Services from '../../models/Services.js';
import UtilityReadings from '../../models/UtilityReadings.js';
import Users from '../../models/Users.js';
import Notifications from '../../models/Notifications.js';
import { notifyRecipient } from '../notifications/notifications.events.js';
import { assertPropertyAccess } from '../properties/properties.service.js';

const billingMonthPattern = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;
const billableStatuses = ['active', 'expired'];

const validNumber = value => Number.isFinite(value) && value >= 0;

const invoiceSummaryFields = 'contract billedTo billingMonth invoiceType totalAmount paidAmount dueDate sentAt status';
const invoiceContract = {
  path: 'contract',
  select: 'room',
  populate: {
    path: 'room',
    select: 'roomNumber property',
    populate: { path: 'property', select: 'name address' },
  },
};
const invoiceContractWithRecipient = { ...invoiceContract, select: 'room representative' };
const tenantInvoiceContract = {
  ...invoiceContractWithRecipient,
  select: 'room representative status endDate signing.depositInvoice',
};

function getInvoiceRecipientId(invoice) {
  return invoice.billedTo || invoice.contract?.representative;
}

async function addInvoiceRecipientNames(invoices) {
  const recipientIds = invoices.map(getInvoiceRecipientId).filter(Boolean);
  const recipients = await Users.find({ _id: { $in: recipientIds } }).select('fullName').lean();
  const names = new Map(recipients.map(user => [String(user._id), user.fullName]));
  return invoices.map(invoice => ({
    ...invoice,
    billedToName: names.get(String(getInvoiceRecipientId(invoice))) || null,
  }));
}

export const getManagedInvoices = async ({ propertyId, billingMonth, sendStatus }, user) => {
  await assertPropertyAccess(user, propertyId);
  const roomIds = await Rooms.distinct('_id', { property: propertyId });
  const contractIds = await Contracts.distinct('_id', { room: { $in: roomIds } });
  const filter = { contract: { $in: contractIds }, billingMonth };
  if (sendStatus === 'unsent') filter.sentAt = null;
  if (sendStatus === 'sent') filter.sentAt = { $ne: null };

  const invoices = await Invoices.find(filter)
    .select(invoiceSummaryFields)
    .sort({ createdAt: -1, _id: -1 })
    .populate(invoiceContractWithRecipient)
    .lean();
  return addInvoiceRecipientNames(invoices);
};

export const getManagedInvoice = async (invoiceId, user) => {
  if (!mongoose.isObjectIdOrHexString(invoiceId)) {
    throw { status: 400, message: 'Mã hóa đơn không hợp lệ!' };
  }
  const invoice = await Invoices.findById(invoiceId)
    .select(invoiceSummaryFields + ' items images')
    .populate(invoiceContractWithRecipient)
    .lean();
  if (!invoice) throw { status: 404, message: 'Không tìm thấy hóa đơn!' };
  await assertPropertyAccess(user, invoice.contract?.room?.property?._id);

  const [result] = await addInvoiceRecipientNames([invoice]);
  return result;
};

export const sendInvoices = async (invoiceIds, user) => {
  await Notifications.init();
  const ids = [...new Set(invoiceIds.map(id => id.toLowerCase()))];
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const invoices = await Invoices.find({ _id: { $in: ids } })
        .select(invoiceSummaryFields)
        .populate({
          ...invoiceContractWithRecipient,
          populate: { path: 'room', select: 'roomNumber property', options: { session } },
          options: { session },
        })
        .session(session)
        .lean();
      if (invoices.length !== ids.length) {
        throw { status: 404, message: 'Có hóa đơn không còn tồn tại. Vui lòng kiểm tra lại danh sách!' };
      }

      const propertyIds = new Set(invoices.map(invoice => String(invoice.contract?.room?.property || '')));
      for (const propertyId of propertyIds) await assertPropertyAccess(user, propertyId, session);

      const pendingInvoices = invoices.filter(invoice => !invoice.sentAt);
      if (!pendingInvoices.length) return { sentCount: 0 };

      const recipientIds = pendingInvoices.map(getInvoiceRecipientId).filter(Boolean);
      const tenantIds = await Users.distinct('_id', {
        _id: { $in: recipientIds },
        role: 'tenant',
        status: 'active',
      }).session(session);
      const activeTenantIds = new Set(tenantIds.map(String));
      const sentAt = new Date();
      const updates = [];

      for (const invoice of pendingInvoices) {
        const label = `phòng ${invoice.contract.room.roomNumber}, kỳ ${invoice.billingMonth}`;
        if (invoice.status === 'cancelled') {
          throw { status: 409, message: `Hóa đơn ${label} đã hủy. Vui lòng kiểm tra lại danh sách!` };
        }
        const billedTo = getInvoiceRecipientId(invoice);
        if (!activeTenantIds.has(String(billedTo))) {
          throw { status: 409, message: `Hóa đơn ${label} chưa có người nhận hợp lệ!` };
        }
        updates.push({
          updateOne: {
            filter: { _id: invoice._id, sentAt: null, status: { $ne: 'cancelled' } },
            update: { $set: { sentAt, billedTo } },
          },
        });
        await Notifications.updateOne(
          { eventKey: `invoice-sent:${invoice._id}`, recipient: billedTo },
          { $setOnInsert: {
            type: 'system', title: 'Bạn có hóa đơn mới',
            content: `Hóa đơn ${label}. Tổng tiền: ${invoice.totalAmount.toLocaleString('vi-VN')} ₫. Vui lòng xem mục Hóa đơn để kiểm tra và thanh toán.`,
            related: { entityType: 'invoice', entityId: invoice._id }, isRead: false,
          } },
          { upsert: true, session },
        );
      }

      const result = await Invoices.bulkWrite(updates, { session });
      if (result.modifiedCount !== updates.length) {
        throw { status: 409, message: 'Danh sách hóa đơn đã thay đổi. Vui lòng tải lại và thử lại!' };
      }
      return { sentCount: result.modifiedCount };
    });
    if (result.sentCount) {
      const recipients = await Invoices.distinct('billedTo', { _id: { $in: ids } });
      for (const recipient of recipients) notifyRecipient(recipient);
    }
    return result;
  } finally {
    await session.endSession();
  }
};

async function getTenantInvoiceFilter(userId) {
  const contractIds = await Contracts.distinct('_id', {
    $or: [{ representative: userId }, { otherMembers: userId }],
  });
  return {
    sentAt: { $ne: null },
    $or: [
      { billedTo: userId },
      { billedTo: null, contract: { $in: contractIds } },
    ],
  };
}

export const getMyInvoices = async userId => {
  const filter = await getTenantInvoiceFilter(userId);
  const invoices = await Invoices.find(filter)
    .select(invoiceSummaryFields)
    .sort({ billingMonth: -1, sentAt: -1, _id: -1 })
    .populate(tenantInvoiceContract)
    .lean();

  return invoices.map(invoice => {
    const canPay = isInvoiceRecipient(invoice, userId) && isDepositPayable(invoice);
    if (invoice.contract) delete invoice.contract.representative;
    return { ...invoice, canPay };
  });
};

function isInvoiceRecipient(invoice, userId) {
  return String(getInvoiceRecipientId(invoice)) === userId.toLowerCase();
}

function isDepositPayable(invoice) {
  return invoice.invoiceType !== 'deposit' || (
    invoice.contract?.status === 'draft' &&
    invoice.contract.endDate >= new Date() &&
    String(invoice.contract.signing?.depositInvoice) === String(invoice._id)
  );
}

export const getMyInvoice = async (invoiceId, userId) => {
  if (!mongoose.isObjectIdOrHexString(invoiceId)) {
    throw { status: 400, message: 'Mã hóa đơn không hợp lệ!' };
  }

  const filter = await getTenantInvoiceFilter(userId);
  const invoice = await Invoices.findOne({ ...filter, _id: invoiceId })
    .select(invoiceSummaryFields + ' items images')
    .populate(tenantInvoiceContract)
    .lean();
  if (!invoice) throw { status: 404, message: 'Không tìm thấy hóa đơn!' };

  const recipientId = getInvoiceRecipientId(invoice);
  const canPay = isInvoiceRecipient(invoice, userId) && isDepositPayable(invoice);
  const recipient = recipientId ? await Users.findById(recipientId).select('fullName').lean() : null;
  if (invoice.contract) {
    if (invoice.billedTo) delete invoice.contract.representative;
    else invoice.contract.representative = recipient;
  }

  return { ...invoice, billedToName: recipient?.fullName || null, canPay };
};

export const getInvoiceForPayment = async ({ invoiceId, roomId }, userId, session) => {
  const invoice = await Invoices.findOne({ _id: invoiceId, sentAt: { $ne: null } })
    .select('contract billedTo status totalAmount paidAmount invoiceType')
    .populate('contract', 'room representative status endDate signing.depositInvoice')
    .session(session)
    .lean();
  if (!invoice || String(invoice.contract?.room) !== roomId.toLowerCase() || !isInvoiceRecipient(invoice, userId)) {
    throw { status: 404, message: 'Không tìm thấy hóa đơn cần thanh toán của bạn!' };
  }
  if (!isDepositPayable(invoice)) {
    throw { status: 409, message: 'Hợp đồng không còn chờ đóng cọc.' };
  }
  return invoice;
};

function duplicateInvoiceError() {
  return { status: 409, message: 'Hợp đồng này đã có hóa đơn trong kỳ!' };
}

function invoiceItem(type, description, quantity, unitPrice) {
  return { type, description, quantity, unitPrice, amount: Math.round(quantity * unitPrice) };
}

export const previewInvoice = async (data, user) => {
  const { contractId, billingMonth } = data;
  if (typeof contractId !== 'string' || !mongoose.isObjectIdOrHexString(contractId)) {
    throw { status: 400, message: 'Mã hợp đồng không hợp lệ!' };
  }
  if (typeof billingMonth !== 'string' || !billingMonthPattern.test(billingMonth)) {
    throw { status: 400, message: 'Kỳ hóa đơn phải có định dạng YYYY-MM!' };
  }

  const contract = await Contracts.findById(contractId).lean();
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại!' };

  const room = await Rooms.findById(contract.room).select('property').lean();
  if (!room) throw { status: 404, message: 'Không tìm thấy phòng của hợp đồng!' };
  await assertPropertyAccess(user, room.property);
  if (!mongoose.isObjectIdOrHexString(contract.representative)) {
    throw { status: 400, message: 'Hợp đồng chưa có người thuê đứng tên!' };
  }

  const [year, month] = billingMonth.split('-').map(Number);
  const monthStart = new Date(`${billingMonth}-01T00:00:00+07:00`);
  const monthEnd = new Date(Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000);
  const contractInPeriod = contract.startDate < monthEnd && contract.endDate >= monthStart;
  if (!billableStatuses.includes(contract.status) || !contractInPeriod) {
    throw { status: 400, message: 'Hợp đồng không phù hợp với kỳ hóa đơn đã chọn!' };
  }

  const [existingInvoice, otherContract, reading, property, services] = await Promise.all([
    Invoices.exists({ contract: contract._id, billingMonth }),
    Contracts.exists({
      _id: { $ne: contract._id },
      room: room._id,
      status: { $in: billableStatuses },
      startDate: { $lt: monthEnd },
      endDate: { $gte: monthStart },
    }),
    UtilityReadings.findOne({ room: room._id, billingMonth }).lean(),
    Properties.findById(room.property).select('utilityRate contractPolicy').lean(),
    Services.find({ property: room.property, status: 'active' }).sort({ name: 1, _id: 1 }).lean(),
  ]);

  if (existingInvoice) throw duplicateInvoiceError();
  if (otherContract) {
    throw {
      status: 409,
      message: 'Phòng có nhiều hợp đồng trong kỳ. Cần đối soát điện nước trước khi lập hóa đơn!',
    };
  }
  if (!reading) {
    throw { status: 400, message: 'Phòng chưa ghi chỉ số điện nước trong kỳ này!' };
  }
  if (!property) throw { status: 404, message: 'Nhà trọ không tồn tại!' };

  const electricityPrice =
    contract.utilityRateSnapshot?.electricityPrice ?? property.utilityRate?.electricityPrice;
  const waterPrice = contract.utilityRateSnapshot?.waterPrice ?? property.utilityRate?.waterPrice;
  const electricityUsed = reading.newElectricity - reading.oldElectricity;
  const waterUsed = reading.newWater - reading.oldWater;
  const paymentDueDay = contract.paymentDueDay ?? property.contractPolicy?.paymentDueDay ?? 5;

  if (![contract.monthlyRent, electricityPrice, waterPrice].every(validNumber)) {
    throw { status: 400, message: 'Tiền thuê hoặc đơn giá điện nước chưa hợp lệ!' };
  }
  if (
    ![
      reading.oldElectricity,
      reading.newElectricity,
      reading.oldWater,
      reading.newWater,
      electricityUsed,
      waterUsed,
    ].every(validNumber)
  ) {
    throw { status: 400, message: 'Chỉ số điện nước trong kỳ chưa hợp lệ!' };
  }
  if (!Number.isInteger(paymentDueDay) || paymentDueDay < 1 || paymentDueDay > 28) {
    throw { status: 400, message: 'Ngày đóng tiền của hợp đồng chưa hợp lệ!' };
  }

  const items = [
    invoiceItem('rent', 'Tiền thuê phòng', 1, contract.monthlyRent),
    invoiceItem('electricity', 'Điện tiêu thụ (kWh)', electricityUsed, electricityPrice),
    invoiceItem('water', 'Nước tiêu thụ (m³)', waterUsed, waterPrice),
  ];

  const residents = new Set(
    [contract.representative, ...(contract.otherMembers || [])].filter(Boolean).map(String),
  );
  for (const service of services) {
    if (!['fixed', 'per_room', 'per_person'].includes(service.unitType)) continue;
    if (!validNumber(service.unitPrice)) {
      throw { status: 400, message: `Đơn giá dịch vụ ${service.name} chưa hợp lệ!` };
    }
    const quantity = service.unitType === 'per_person' ? residents.size : 1;
    items.push(invoiceItem('service', service.name, quantity, service.unitPrice));
  }

  const totalAmount = items.reduce((total, item) => total + item.amount, 0);
  if (!Number.isSafeInteger(totalAmount)) {
    throw { status: 400, message: 'Tổng tiền hóa đơn vượt quá giá trị hợp lệ!' };
  }

  return {
    contract: contract._id,
    billedTo: contract.representative,
    utilityReading: reading._id,
    billingMonth,
    items,
    totalAmount,
    dueDate: new Date(Date.UTC(year, month, paymentDueDay)),
  };
};

export const createInvoice = async (data, user) => {
  if (!Number.isSafeInteger(data.expectedTotalAmount) || data.expectedTotalAmount < 0) {
    throw { status: 400, message: 'Vui lòng xem trước hóa đơn để xác nhận tổng tiền!' };
  }

  const invoice = await previewInvoice(data, user);
  if (invoice.totalAmount !== data.expectedTotalAmount) {
    throw { status: 409, message: 'Tổng tiền đã thay đổi. Vui lòng xem trước hóa đơn lại!' };
  }

  await Invoices.init();
  try {
    return await Invoices.create({ ...invoice, createdBy: user.userId });
  } catch (error) {
    if (error.code === 11000) throw duplicateInvoiceError();
    throw error;
  }
};
