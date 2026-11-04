import Contracts from '../../models/Contracts.js';
import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';
import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Users from '../../models/Users.js';
import mongoose from 'mongoose';

async function validateOccupants({ room, representative, otherMembers = [], excludeContractId = null, status = 'active' }) {
  const memberIds = otherMembers.map(member => String(member?._id || member));
  const allIds = [String(representative?._id || representative), ...memberIds];
  if (new Set(allIds).size !== allIds.length) {
    throw { status: 400, message: 'Người đại diện và người ở cùng không được trùng nhau.' };
  }
  if (allIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
    throw { status: 400, message: 'Danh sách người thuê không hợp lệ.' };
  }
  if (allIds.length > Math.max(1, Number(room.maxTenants || 1))) {
    throw { status: 409, message: `Phòng chỉ đủ chỗ cho ${room.maxTenants || 1} người.` };
  }

  const users = await Users.find({ _id: { $in: allIds }, role: 'tenant', status: 'active' }).select('_id');
  if (users.length !== allIds.length) {
    throw { status: 400, message: 'Tất cả người ở trong hợp đồng phải là tài khoản người thuê đang hoạt động.' };
  }
  if (status === 'active') {
    const active = await Contracts.findOne({
      status: 'active',
      ...(excludeContractId ? { _id: { $ne: excludeContractId } } : {}),
      $or: [{ representative: { $in: allIds } }, { otherMembers: { $in: allIds } }],
    }).select('room');
    if (active) throw { status: 409, message: 'Một trong những người thuê đã thuộc hợp đồng đang hoạt động khác.' };
  }
}

export const getContractsByProperty = async (propertyId) => {
  const contracts = await Contracts.find()
    .populate({
      path: 'room',
      match: { property: propertyId },
    })
    .populate('representative', 'fullName email phone')
    .populate('otherMembers', 'fullName email phone')
    .populate('rentalRequest')
    .populate('template')
    .populate('createdBy', 'fullName email');

  return contracts.filter(contract => contract.room !== null);
};

export const getContractById = async (contractId) => {
  const contract = await Contracts.findById(contractId)
    .populate('room')
    .populate('representative', 'fullName email phone')
    .populate('otherMembers', 'fullName email phone')
    .populate('rentalRequest')
    .populate('template')
    .populate('createdBy', 'fullName email');

  if (!contract) {
    throw { status: 404, message: 'Hợp đồng không tồn tại' };
  }
  return contract;
};

export const createContract = async (data) => {
  const room = await Rooms.findById(data.room);
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }

  const activeContract = await Contracts.findOne({ room: data.room, status: 'active' });
  if (activeContract) {
    throw { status: 400, message: 'Phòng này đã có hợp đồng hoạt động' };
  }

  if (data.rentalRequest) {
    const rentalRequest = await RentalRequests.findById(data.rentalRequest);
    if (!rentalRequest) {
      throw { status: 404, message: 'Yêu cầu thuê không tồn tại' };
    }
    if (rentalRequest.status !== 'approved') {
      throw { status: 400, message: 'Yêu cầu thuê phải được phê duyệt' };
    }
    if (String(rentalRequest.room) !== String(data.room)) {
      throw { status: 400, message: 'Hợp đồng phải dùng đúng phòng của yêu cầu đã duyệt' };
    }
    if (String(rentalRequest.tenant) !== String(data.representative)) {
      throw { status: 400, message: 'Người đại diện phải là người gửi yêu cầu thuê đã duyệt' };
    }
  }

  await validateOccupants({ room, representative: data.representative, otherMembers: data.otherMembers, status: data.status || 'active' });

  const contract = await Contracts.create(data);
  return contract.populate([
    'room',
    { path: 'representative', select: 'fullName email phone' },
    { path: 'otherMembers', select: 'fullName email phone' },
    'rentalRequest',
    'template',
    { path: 'createdBy', select: 'fullName email' },
  ]);
};

export const updateContract = async (contractId, data) => {
  const contract = await Contracts.findById(contractId);
  if (!contract) {
    throw { status: 404, message: 'Hợp đồng không tồn tại' };
  }

  const lockedFields = ['monthlyRent', 'depositAmount'];
  for (const field of lockedFields) {
    if (data[field] && contract.status !== 'draft') {
      throw { status: 400, message: `Không thể chỉnh sửa ${field} sau khi ký hợp đồng` };
    }
  }

  const editableFields = [
    'startDate',
    'endDate',
    'monthlyRent',
    'depositAmount',
    'status',
    'template',
    'representative',
    'otherMembers',
  ];
  for (const field of editableFields) {
    if (Object.hasOwn(data, field)) contract[field] = data[field];
  }
  if (Object.hasOwn(data, 'otherMembers') || Object.hasOwn(data, 'representative') || Object.hasOwn(data, 'status')) {
    const room = await Rooms.findById(contract.room);
    if (!room) throw { status: 404, message: 'Phòng không tồn tại.' };
    await validateOccupants({ room, representative: contract.representative, otherMembers: contract.otherMembers, excludeContractId: contract._id, status: contract.status });
  }
  await contract.save();

  return contract.populate([
    'room',
    { path: 'representative', select: 'fullName email phone' },
    { path: 'otherMembers', select: 'fullName email phone' },
    'rentalRequest',
    'template',
    { path: 'createdBy', select: 'fullName email' },
  ]);
};

export const renewContract = async (contractId, newEndDate) => {
  const contract = await Contracts.findById(contractId);
  if (!contract) {
    throw { status: 404, message: 'Hợp đồng không tồn tại' };
  }

  if (contract.status !== 'active') {
    throw { status: 400, message: 'Chỉ có thể gia hạn hợp đồng hoạt động' };
  }

  const newEndDateObj = new Date(newEndDate);
  if (newEndDateObj <= contract.endDate) {
    throw { status: 400, message: 'Ngày kết thúc mới phải sau ngày kết thúc hiện tại' };
  }

  contract.endDate = newEndDate;
  await contract.save();

  return contract.populate([
    'room',
    { path: 'representative', select: 'fullName email phone' },
    { path: 'otherMembers', select: 'fullName email phone' },
    'rentalRequest',
    'template',
    { path: 'createdBy', select: 'fullName email' },
  ]);
};

export const changeRepresentative = async (contractId, newRepresentativeId) => {
  const contract = await Contracts.findById(contractId);
  if (!contract) {
    throw { status: 404, message: 'Hợp đồng không tồn tại' };
  }

  const allMembers = [contract.representative, ...contract.otherMembers];
  const isMember = allMembers.some(member => member.toString() === newRepresentativeId);
  if (!isMember) {
    throw { status: 400, message: 'Người đại diện mới phải là thành viên của hợp đồng' };
  }

  const oldRepresentative = contract.representative;
  contract.representative = newRepresentativeId;

  if (!contract.otherMembers.includes(oldRepresentative)) {
    contract.otherMembers.push(oldRepresentative);
  }
  contract.otherMembers = contract.otherMembers.filter(
    member => member.toString() !== newRepresentativeId,
  );

  await contract.save();

  return contract.populate([
    'room',
    { path: 'representative', select: 'fullName email phone' },
    { path: 'otherMembers', select: 'fullName email phone' },
    'rentalRequest',
    'template',
    { path: 'createdBy', select: 'fullName email' },
  ]);
};

export const searchContracts = async (filters, user) => {
  const query = {};

  const propertyIds = user.role === 'landlord'
    ? await Properties.distinct('_id', { owner: user.userId })
    : await ManagerAssignments.distinct('property', { manager: user.userId, status: 'active' });
  const roomIds = await Rooms.distinct('_id', { property: { $in: propertyIds } });
  query.room = filters.room
    ? roomIds.some(id => String(id) === String(filters.room)) ? filters.room : { $in: [] }
    : { $in: roomIds };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.representative) {
    query.representative = filters.representative;
  }

  const contracts = await Contracts.find(query)
    .populate('room')
    .populate('representative', 'fullName email phone')
    .populate('otherMembers', 'fullName email phone')
    .populate('createdBy', 'fullName email');

  return contracts;
};

export async function getOccupants(contractId) {
  const contract = await Contracts.findById(contractId)
    .populate('room', 'roomNumber maxTenants property')
    .populate('representative', 'fullName email phone')
    .populate('otherMembers', 'fullName email phone');
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };
  return {
    contractId: contract._id,
    status: contract.status,
    room: contract.room,
    representative: contract.representative,
    otherMembers: contract.otherMembers,
    capacity: contract.room?.maxTenants || 1,
    occupied: 1 + contract.otherMembers.length,
  };
}

export async function listCoResidentCandidates(contractId, search = '', page = 1, pageSize = 20) {
  const contract = await Contracts.findById(contractId).populate('room', 'property maxTenants');
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };
  if (contract.status !== 'active') throw { status: 400, message: 'Chỉ hợp đồng đang hoạt động mới quản lý được người ở cùng.' };
  const currentIds = [contract.representative, ...contract.otherMembers];
  const assigned = await Contracts.distinct('representative', { status: 'active', _id: { $ne: contract._id } });
  const assignedMembers = await Contracts.distinct('otherMembers', { status: 'active', _id: { $ne: contract._id } });
  const unavailable = [...currentIds, ...assigned, ...assignedMembers];
  const query = { role: 'tenant', status: 'active', _id: { $nin: unavailable } };
  const term = String(search || '').trim();
  if (term) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [{ fullName: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }, { phone: new RegExp(safe, 'i') }];
  }
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const [items, totalCount] = await Promise.all([
    Users.find(query).select('fullName email phone').sort({ fullName: 1, _id: 1 }).skip((pageNumber - 1) * size).limit(size),
    Users.countDocuments(query),
  ]);
  return { items, totalCount, page: pageNumber, pageSize: size, totalPages: Math.ceil(totalCount / size) };
}

export async function setCoResidents(contractId, residentIds) {
  if (!Array.isArray(residentIds)) throw { status: 400, message: 'Danh sách người ở cùng không hợp lệ.' };
  const contract = await Contracts.findById(contractId);
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };
  if (contract.status !== 'active') throw { status: 400, message: 'Chỉ hợp đồng đang hoạt động mới quản lý được người ở cùng.' };
  const room = await Rooms.findById(contract.room);
  if (!room) throw { status: 404, message: 'Phòng không tồn tại.' };
  await validateOccupants({ room, representative: contract.representative, otherMembers: residentIds, excludeContractId: contract._id, status: 'active' });
  contract.otherMembers = residentIds;
  await contract.save();
  return getOccupants(contract._id);
}
