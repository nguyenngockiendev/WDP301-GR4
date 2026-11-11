import bcrypt from 'bcryptjs';
import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';
import Users from '../../models/Users.js';
import Contracts from '../../models/Contracts.js';
import { notifyRentalResult } from '../notifications/notifications-jobs.service.js';
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

  const requests = await RentalRequests.find(query).sort({ createdAt: -1 }).populate(populateFields);
  const contractIds = await Contracts.distinct('rentalRequest', {
    rentalRequest: { $in: requests.map(request => request._id) },
  });
  const contracted = new Set(contractIds.map(String));
  return requests.map(request => ({ ...request.toObject(), hasContract: contracted.has(String(request._id)) }));
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

/** Guest requests a room first; the assigned manager creates the tenant login after approval. */
export const createGuestRentalRequest = async data => {
  const room = await Rooms.findById(data.room);
  if (!room) throw { status: 404, message: 'Phòng không tồn tại' };
  if (room.status !== 'available') throw { status: 400, message: 'Phòng hiện không khả dụng' };

  const email = String(data.email).trim().toLowerCase();
  const existingUser = await Users.findOne({ email }).select('_id role');
  const duplicateQuery = { room: room._id, status: 'pending', $or: [{ 'guest.email': email }] };
  if (existingUser?.role === 'tenant') duplicateQuery.$or.push({ tenant: existingUser._id });
  if (await RentalRequests.exists(duplicateQuery)) {
    throw { status: 409, message: 'Email này đã gửi yêu cầu cho phòng, vui lòng chờ xử lý' };
  }

  const request = await RentalRequests.create({
    room: room._id,
    expectedDate: data.expectedDate,
    note: String(data.note || '').trim(),
    guest: { fullName: String(data.fullName).trim(), email, phone: String(data.phone).trim() },
  });
  return request.populate(populateFields);
};

/** Cấp tài khoản guest sau khi hợp đồng đã được tạo. */
export const createTenantAccountForRequest = async (requestId, data, user) => {
  if (user.role !== 'manager') throw { status: 403, message: 'Chỉ quản lý được phân công mới tạo tài khoản người thuê' };
  const { request } = await findRequestWithAccess(requestId, user);
  if (request.status !== 'approved') throw { status: 409, message: 'Chỉ tạo tài khoản từ yêu cầu đã được duyệt' };
  if (!request.guest?.email || !request.guest?.fullName) throw { status: 400, message: 'Yêu cầu này không phải yêu cầu từ guest' };
  const contract = await Contracts.findOne({ rentalRequest: request._id });
  if (!contract) throw { status: 409, message: 'Hãy tạo hợp đồng thành công trước khi cấp tài khoản' };
  if (contract.status !== 'draft') throw { status: 409, message: 'Chỉ cấp tài khoản khi hợp đồng còn ở trạng thái nháp' };
  if (contract.representative) throw { status: 409, message: 'Hợp đồng này đã được gắn tài khoản người thuê' };

  const email = request.guest.email.trim().toLowerCase();
  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    if (existingUser.role !== 'tenant') throw { status: 409, message: 'Email này đã được dùng cho tài khoản khác' };
    request.tenant = existingUser._id;
    contract.representative = existingUser._id;
    await request.save();
    await contract.save();
    return { request: await request.populate(populateFields), existingAccount: true, username: existingUser.username };
  }

  const username = email;
  if (await Users.exists({ username })) throw { status: 409, message: 'Tên đăng nhập email đã được sử dụng' };
  const temporaryPassword = String(data.password);
  const tenant = await Users.create({
    username,
    email,
    fullName: request.guest.fullName,
    phone: request.guest.phone,
    password: await bcrypt.hash(temporaryPassword, Number(process.env.SALT_ROUNDS) || 10),
    role: 'tenant',
    status: 'active',
    isVerified: true,
    createdBy: user.userId,
  });
  request.tenant = tenant._id;
  contract.representative = tenant._id;
  await request.save();
  await contract.save();
  return {
    request: await request.populate(populateFields),
    existingAccount: false,
    credentials: { username: tenant.username, email: tenant.email, password: temporaryPassword },
  };
};

export const processRentalRequest = async (requestId, data, user) => {
  if (user.role !== 'manager') throw { status: 403, message: 'Chỉ quản lý được phân công được xử lý yêu cầu thuê' };
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
  request.notificationPending = true;
  request.processedBy = user.userId;
  if (data.status === 'rejected') {
    request.rejectReason = data.rejectReason;
  }

  await request.save();
  if (request.tenant) {
    try { await notifyRentalResult(request); }
    catch (error) { console.error('[Notifications] Sẽ thử lại thông báo thuê:', error.message); }
  }
  return request.populate(populateFields);
};
