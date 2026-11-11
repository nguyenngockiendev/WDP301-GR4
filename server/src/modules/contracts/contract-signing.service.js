import mongoose from 'mongoose';
import Contracts from '../../models/Contracts.js';
import Invoices from '../../models/Invoices.js';
import Notifications from '../../models/Notifications.js';
import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';
import { notifyRecipient } from '../notifications/notifications.events.js';
import { assertPropertyAccess } from '../properties/properties.service.js';
import { renderContractDocument } from './contracts.service.js';
import { isValidPaymentAmount } from '../payments/payments.validation.js';
import { getContractStartCutoff } from './contract-dates.js';

const waiting = ['awaiting_tenant', 'awaiting_manager'];
const signingFields = '+signing.document +signing.tenantSignature +signing.managerSignature';

function conflict(message) {
  throw { status: 409, message };
}

function getSignature(image, userId) {
  const match =
    typeof image === 'string' &&
    image.length <= 250000 &&
    /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  const png = match && Buffer.from(match[1], 'base64');
  if (
    !png ||
    png.length < 57 ||
    png.subarray(0, 16).toString('hex') !== '89504e470d0a1a0a0000000d49484452' ||
    png.readUInt32BE(16) !== 600 ||
    png.readUInt32BE(20) !== 200 ||
    png.subarray(-12).toString('hex') !== '0000000049454e44ae426082'
  ) {
    throw { status: 400, message: 'Chữ ký không hợp lệ. Vui lòng ký lại trên màn hình.' };
  }
  return { image, signedBy: userId, signedAt: new Date() };
}

async function getSigningContract(id, user, session = null) {
  const contract =
    mongoose.isObjectIdOrHexString(id) &&
    (await Contracts.findById(id).select(signingFields).session(session));
  if (!contract) throw { status: 404, message: 'Không tìm thấy hợp đồng.' };
  if (user.role === 'tenant') {
    const tenantId =
      contract.signing?.status === 'signed'
        ? contract.signing.tenantSignature?.signedBy
        : contract.representative;
    if (String(tenantId) !== user.userId || !contract.signing?.document) {
      throw { status: 404, message: 'Không tìm thấy hợp đồng đã gửi ký.' };
    }
  } else {
    const room = await Rooms.findById(contract.room).select('property').session(session);
    await assertPropertyAccess(user, room?.property, session);
  }
  return contract;
}

export const listTenantSigningContracts = userId =>
  Contracts.find({
    'signing.status': { $exists: true },
    $or: [
      { representative: userId, 'signing.status': { $ne: 'signed' } },
      { 'signing.status': 'signed', 'signing.tenantSignature.signedBy': userId },
    ],
  })
    .select('room status startDate endDate signing.title signing.status')
    .populate({
      path: 'room',
      select: 'roomNumber property',
      populate: { path: 'property', select: 'name' },
    })
    .sort({ updatedAt: -1 })
    .lean();

export async function getSigningDocument(id, user) {
  const contract = await getSigningContract(id, user);
  if (!contract.signing?.document) throw { status: 404, message: 'Hợp đồng chưa được gửi ký.' };
  const depositInvoice = contract.signing.depositInvoice && await Invoices.findOne({
    _id: contract.signing.depositInvoice,
    contract: contract._id,
    invoiceType: 'deposit',
  }).select('invoiceType billedTo totalAmount paidAmount status sentAt').lean();
  return {
    status: contract.status,
    startDate: contract.startDate,
    signing: contract.signing,
    depositInvoice: depositInvoice ? {
      ...depositInvoice,
      contract: { room: { _id: contract.room } },
      canPay: user.role === 'tenant' && String(depositInvoice.billedTo) === user.userId &&
        contract.status === 'draft' && contract.endDate >= new Date(),
    } : null,
  };
}

async function lockReservedRoom(contract, session) {
  const room = await Rooms.findOneAndUpdate(
    { _id: contract.room, status: 'reserved' },
    { $inc: { __v: 1 } },
    { session, new: true },
  );
  if (!room) conflict('Phòng không còn được giữ cho yêu cầu thuê.');
  const approved = await RentalRequests.exists({
    _id: contract.rentalRequest,
    room: room._id,
    tenant: contract.representative,
    status: 'approved',
  }).session(session);
  if (!approved) conflict('Yêu cầu thuê không còn được duyệt cho hợp đồng này.');
  const competing = await Contracts.exists({
    _id: { $ne: contract._id },
    room: room._id,
    $or: [
      { status: 'active' },
      { status: 'draft', 'signing.status': { $in: [...waiting, 'signed'] } },
    ],
  }).session(session);
  if (competing) conflict('Phòng đã có hợp đồng đang ký hoặc đang hiệu lực.');
  return room;
}

async function activateContract(contract, room, session) {
  contract.status = 'active';
  room.status = 'occupied';
  await room.save({ session });
}

async function createDepositInvoice(contract, managerId, now, session) {
  const amount = contract.depositAmount;
  if (!isValidPaymentAmount(amount)) {
    throw { status: 400, message: 'Tiền cọc phải là số nguyên VND hợp lệ để thanh toán qua VNPay.' };
  }
  const [invoice] = await Invoices.create([{
    contract: contract._id,
    invoiceType: 'deposit',
    billedTo: contract.representative,
    billingMonth: 'DEPOSIT',
    items: [{ type: 'other', description: 'Tiền đặt cọc hợp đồng', quantity: 1, unitPrice: amount, amount }],
    totalAmount: amount,
    status: 'unpaid',
    sentAt: now,
    dueDate: contract.startDate > now ? contract.startDate : now,
    createdBy: managerId,
  }], { session });
  return invoice._id;
}

export async function changeSigning(id, action, data, user) {
  const isTenantAction = action === 'tenant-sign' || action === 'reject';
  if (user.role !== (isTenantAction ? 'tenant' : 'manager')) {
    throw { status: 403, message: 'Bạn không có quyền thực hiện thao tác ký này.' };
  }
  const recipient = await mongoose.connection.transaction(async session => {
    const contract = await getSigningContract(id, user, session);
    const current = contract.signing;
    const now = new Date();
    if (!contract.rentalRequest || contract.status !== 'draft' || contract.endDate < now) {
      conflict('Hợp đồng không còn đủ điều kiện ký.');
    }
    let notification;
    const notify = (recipientId, title, content) => {
      notification = { recipient: recipientId, title, content };
    };

    if (action === 'send') {
      if (current && !['withdrawn', 'rejected'].includes(current.status))
        conflict('Hợp đồng đã được gửi ký.');
      await lockReservedRoom(contract, session);
      const tenantId = contract.representative;
      const document = await renderContractDocument(contract);
      contract.signing = {
        revision: new mongoose.Types.ObjectId(),
        status: 'awaiting_tenant',
        requestedBy: user.userId,
        title: document.title,
        document: document.content,
      };
      notify(tenantId, 'Hợp đồng đang chờ bạn ký', 'Mở hợp đồng để đọc nội dung và xác nhận.');
    } else {
      if (!current || String(current.revision) !== data.revision)
        conflict('Bản hợp đồng đã thay đổi. Vui lòng tải lại.');
      if (action === 'tenant-sign' && current.status === 'awaiting_tenant') {
        current.tenantSignature = getSignature(data.image, user.userId);
        current.status = 'awaiting_manager';
        notify(
          current.requestedBy,
          'Khách thuê đã ký hợp đồng',
          'Hợp đồng đang chờ quản lý ký xác nhận.',
        );
      } else if (action === 'reject' && current.status === 'awaiting_tenant') {
        const reason = typeof data.reason === 'string' && data.reason.trim();
        if (!reason || reason.length > 500)
          throw { status: 400, message: 'Nhập lý do từ chối, tối đa 500 ký tự.' };
        current.rejectionReason = reason;
        current.status = 'rejected';
        notify(current.requestedBy, 'Khách thuê từ chối hợp đồng', reason);
      } else if (action === 'withdraw' && waiting.includes(current.status)) {
        current.status = 'withdrawn';
        notify(
          contract.representative,
          'Bản hợp đồng đã được thu hồi',
          'Quản lý có thể gửi lại bản đã chỉnh sửa.',
        );
      } else if (
        action === 'manager-sign' &&
        current.status === 'awaiting_manager' &&
        current.tenantSignature
      ) {
        const room = await lockReservedRoom(contract, session);
        current.managerSignature = getSignature(data.image, user.userId);
        current.status = 'signed';
        if (contract.depositAmount > 0) {
          current.depositInvoice = await createDepositInvoice(contract, user.userId, now, session);
          notify(contract.representative, 'Hợp đồng đã ký đủ, chờ đóng cọc',
            'Mở hợp đồng để thanh toán tiền cọc qua VNPay.');
        } else {
          if (contract.startDate <= getContractStartCutoff(now)) {
            await activateContract(contract, room, session);
          }
          notify(
            contract.representative,
            'Hợp đồng đã ký đủ',
            contract.status === 'active'
              ? 'Hợp đồng đã có hiệu lực.'
              : 'Hợp đồng sẽ có hiệu lực vào ngày bắt đầu thuê.',
          );
        }
      } else {
        conflict('Thao tác không phù hợp với trạng thái ký hiện tại.');
      }
    }

    await contract.save({ session });
    await Notifications.create(
      [
        {
          ...notification,
          type: 'system',
          related: { entityType: 'contract_signing', entityId: contract._id },
        },
      ],
      { session },
    );
    return notification.recipient;
  });
  notifyRecipient(recipient);
}

function dueSignedContracts(now) {
  return {
    status: 'draft',
    'signing.status': 'signed',
    startDate: { $lte: getContractStartCutoff(now) },
    endDate: { $gte: now },
  };
}

export async function activateSignedContractIfDue(contractId, now = new Date()) {
  try {
    await mongoose.connection.transaction(async session => {
      const contract = await Contracts.findOne({ _id: contractId, ...dueSignedContracts(now) }).session(session);
      if (!contract) return;
      if (contract.signing.depositInvoice) {
        const paid = await Invoices.exists({
          _id: contract.signing.depositInvoice,
          contract: contract._id,
          invoiceType: 'deposit',
          status: 'paid',
          paidAmount: { $gte: contract.depositAmount },
        }).session(session);
        if (!paid) return;
      }
      const room = await lockReservedRoom(contract, session);
      await activateContract(contract, room, session);
      await contract.save({ session });
    });
  } catch (error) {
    console.error('[ContractSigning] Không kích hoạt được hợp đồng', String(contractId), error.message);
  }
}

export async function activateDueSignedContracts(now = new Date()) {
  const due = dueSignedContracts(now);
  for await (const item of Contracts.find(due).select('_id').cursor()) {
    await activateSignedContractIfDue(item._id, now);
  }
}

export function startSignedContractActivation() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await activateDueSignedContracts();
    } catch (error) {
      console.error('[ContractSigning] Lỗi kiểm tra ngày hiệu lực:', error.message);
    } finally {
      running = false;
    }
  };
  void run();
  setInterval(run, 60000).unref();
}
