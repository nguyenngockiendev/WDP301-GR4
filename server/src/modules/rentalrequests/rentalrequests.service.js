import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';

export const getRentalRequestsByProperty = async (propertyId) => {
  const requests = await RentalRequests.find()
    .populate({
      path: 'room',
      match: { property: propertyId },
    })
    .populate('tenant', 'fullName email phone')
    .populate('processedBy', 'fullName email');

  return requests.filter(req => req.room !== null);
};

export const getRentalRequestById = async (requestId) => {
  const request = await RentalRequests.findById(requestId)
    .populate('room')
    .populate('tenant', 'fullName email phone')
    .populate('processedBy', 'fullName email');

  if (!request) {
    throw { status: 404, message: 'Yêu cầu thuê không tồn tại' };
  }
  return request;
};

export const createRentalRequest = async (data) => {
  const room = await Rooms.findById(data.room);
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }

  if (room.status !== 'available') {
    throw { status: 400, message: 'Phòng hiện không khả dụng' };
  }

  const request = await RentalRequests.create(data);
  return request.populate([
    { path: 'room' },
    { path: 'tenant', select: 'fullName email phone' },
  ]);
};

export const processRentalRequest = async (requestId, data, userId) => {
  const request = await RentalRequests.findById(requestId);
  if (!request) {
    throw { status: 404, message: 'Yêu cầu thuê không tồn tại' };
  }

  if (request.status !== 'pending') {
    throw { status: 400, message: 'Yêu cầu này đã được xử lý' };
  }

  if (data.status === 'approved') {
    const room = await Rooms.findById(request.room);
    if (room.status !== 'available') {
      throw { status: 400, message: 'Phòng không còn khả dụng' };
    }

    room.status = 'reserved';
    await room.save();
  }

  request.status = data.status;
  request.processedBy = userId;
  if (data.status === 'rejected') {
    request.rejectReason = data.rejectReason;
  }

  await request.save();
  return request.populate([
    { path: 'room' },
    { path: 'tenant', select: 'fullName email phone' },
    { path: 'processedBy', select: 'fullName email' },
  ]);
};

export const getPendingRequests = async (propertyId) => {
  const requests = await RentalRequests.find({ status: 'pending' })
    .populate({
      path: 'room',
      match: { property: propertyId },
    })
    .populate('tenant', 'fullName email phone');

  return requests.filter(req => req.room !== null);
};
