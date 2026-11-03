import mongoose from 'mongoose';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import RentalRequests from '../../models/RentalRequests.js';
import Contracts from '../../models/Contracts.js';
import { sendError } from '../utils/response.js';

async function canManageProperty(user, propertyId) {
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) return false;
  if (user.role === 'landlord') {
    return Boolean(await Properties.exists({ _id: propertyId, owner: user.userId }));
  }
  if (user.role === 'manager') {
    return Boolean(await ManagerAssignments.exists({ manager: user.userId, property: propertyId, status: 'active' }));
  }
  return false;
}

const notFound = (res, message) => sendError(res, { status: 404, message });

export async function requirePropertyManager(req, res, next) {
  try {
    let propertyId = req.params.propertyId || req.body?.property || req.query?.propertyId;
    const roomId = req.params.roomId || req.body?.room;
    if (roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return sendError(res, { status: 400, message: 'Mã phòng không hợp lệ.' });
      }
      const room = await Rooms.findById(roomId).select('property');
      if (!room) return notFound(res, 'Không tìm thấy phòng.');
      if (propertyId && String(propertyId) !== String(room.property)) {
        return sendError(res, { status: 403, message: 'Phòng không thuộc nhà trọ được chọn.' });
      }
      propertyId = room.property;
    }
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return sendError(res, { status: 400, message: 'Nhà trọ không hợp lệ.' });
    }
    if (!await canManageProperty(req.user, propertyId)) {
      return sendError(res, { status: 403, message: 'Bạn không được quản lý nhà trọ này.' });
    }
    req.propertyId = propertyId;
    next();
  } catch (error) { next(error); }
}

export async function requireRentalRequestManager(req, res, next) {
  try {
    const request = await RentalRequests.findById(req.params.requestId).populate('room', 'property');
    if (!request) return notFound(res, 'Yêu cầu thuê không tồn tại.');
    if (!request.room || !await canManageProperty(req.user, request.room.property)) {
      return sendError(res, { status: 403, message: 'Bạn không được xử lý yêu cầu thuê của nhà trọ này.' });
    }
    req.rentalRequest = request;
    next();
  } catch (error) { next(error); }
}

export async function requireRentalRequestAccess(req, res, next) {
  try {
    const request = await RentalRequests.findById(req.params.requestId).populate('room', 'property');
    if (!request) return notFound(res, 'Yêu cầu thuê không tồn tại.');
    const isTenant = req.user.role === 'tenant' && String(request.tenant) === String(req.user.userId);
    const isManager = request.room && await canManageProperty(req.user, request.room.property);
    if (!isTenant && !isManager) {
      return sendError(res, { status: 403, message: 'Bạn không có quyền xem yêu cầu thuê này.' });
    }
    req.rentalRequest = request;
    next();
  } catch (error) { next(error); }
}

export async function requireContractManager(req, res, next) {
  try {
    const contract = await Contracts.findById(req.params.contractId).populate('room', 'property');
    if (!contract) return notFound(res, 'Hợp đồng không tồn tại.');
    if (!contract.room || !await canManageProperty(req.user, contract.room.property)) {
      return sendError(res, { status: 403, message: 'Bạn không được quản lý hợp đồng của nhà trọ này.' });
    }
    req.contract = contract;
    next();
  } catch (error) { next(error); }
}

export async function requireContractAccess(req, res, next) {
  try {
    const contract = await Contracts.findById(req.params.contractId).populate('room', 'property');
    if (!contract) return notFound(res, 'Hợp đồng không tồn tại.');
    const isTenant = req.user.role === 'tenant' && (
      String(contract.representative) === String(req.user.userId) ||
      contract.otherMembers.some(member => String(member) === String(req.user.userId))
    );
    const isManager = contract.room && await canManageProperty(req.user, contract.room.property);
    if (!isTenant && !isManager) {
      return sendError(res, { status: 403, message: 'Bạn không có quyền xem hợp đồng này.' });
    }
    req.contract = contract;
    next();
  } catch (error) { next(error); }
}

export async function requireTenantManagerAccess(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.tenantId)) {
      return sendError(res, { status: 400, message: 'Mã người thuê không hợp lệ.' });
    }
    const propertyIds = req.user.role === 'landlord'
      ? await Properties.distinct('_id', { owner: req.user.userId })
      : await ManagerAssignments.distinct('property', { manager: req.user.userId, status: 'active' });
    const roomIds = await Rooms.distinct('_id', { property: { $in: propertyIds } });
    const contract = await Contracts.findOne({
      room: { $in: roomIds },
      $or: [{ representative: req.params.tenantId }, { otherMembers: req.params.tenantId }],
    }).select('_id');
    if (!contract) return notFound(res, 'Không tìm thấy người thuê trong nhà trọ bạn quản lý.');
    req.allowedPropertyIds = propertyIds;
    next();
  } catch (error) { next(error); }
}
