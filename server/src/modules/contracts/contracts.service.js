import Contracts from '../../models/Contracts.js';
import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';

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
  }

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

  Object.assign(contract, data);
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

export const searchContracts = async (filters) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.room) {
    query.room = filters.room;
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
