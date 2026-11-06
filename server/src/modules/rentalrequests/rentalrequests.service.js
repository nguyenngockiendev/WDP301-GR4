import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';
import { assertPropertyAccess } from '../properties/properties.service.js';

const populateFields = [
  { path: 'room', select: 'roomNumber price area status property' },
  { path: 'tenant', select: 'fullName email phone' },
  { path: 'processedBy', select: 'fullName email' },
];

/** Lấy yêu cầu và kiểm tra user có quyền với nhà trọ chứa phòng được yêu cầu. */
const findRequestWithAccess = async (requestId, user) => {
  const request = await RentalRequests.findById(requestId);
  if (!request) {
    throw { status: 404, message: 'Yêu cầu thuê không tồn tại' };
  }
  const room = await Rooms.findById(request.room).select('property');
  await assertPropertyAccess(user, room?.property);
  return { request, room };
};

export const getRentalRequestsByProperty = async (propertyId, user, status) => {
  await assertPropertyAccess(user, propertyId);

  const roomIds = await Rooms.find({ property: propertyId }).distinct('_id');
  const query = { room: { $in: roomIds } };
  if (status) query.status = status;

  return RentalRequests.find(query).sort({ createdAt: -1 }).populate(populateFields);
};

export const getPendingRequests = (propertyId, user) => getRentalRequestsByProperty(propertyId, user, 'pending');

export const getRentalRequestById = async (requestId, user) => {
  const { request } = await findRequestWithAccess(requestId, user);
  return request.populate(populateFields);
};

/** Người thuê gửi yêu cầu thuê phòng (tenant lấy từ token). */
export const createRentalRequest = async (data, user) => {
  const room = await Rooms.findById(data.room);
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }

  if (room.status !== 'available') {
    throw { status: 400, message: 'Phòng hiện không khả dụng' };
  }

  const duplicated = await RentalRequests.exists({ tenant: user.userId, room: data.room, status: 'pending' });
  if (duplicated) {
    throw { status: 400, message: 'Bạn đã gửi yêu cầu cho phòng này, vui lòng chờ xử lý' };
  }

  const request = await RentalRequests.create({
    tenant: user.userId,
    room: data.room,
    expectedDate: data.expectedDate,
    note: data.note,
  });
  return request.populate(populateFields);
};

export const processRentalRequest = async (requestId, data, user) => {
  const { request } = await findRequestWithAccess(requestId, user);

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
  request.processedBy = user.userId;
  if (data.status === 'rejected') {
    request.rejectReason = data.rejectReason;
  }

  await request.save();
  return request.populate(populateFields);
};
