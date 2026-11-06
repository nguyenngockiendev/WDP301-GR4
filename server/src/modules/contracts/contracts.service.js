import Contracts from '../../models/Contracts.js';
import RentalRequests from '../../models/RentalRequests.js';
import Rooms from '../../models/Rooms.js';
import Users from '../../models/Users.js';
import Properties from '../../models/Properties.js';
import ContractTemplates from '../../models/ContractTemplates.js';
import { assertPropertyAccess } from '../properties/properties.service.js';
import { buildPlaceholderValues, fillTemplate } from '../contracttemplates/contracttemplates.placeholders.js';

const populateFields = [
  { path: 'room', populate: { path: 'property', select: 'name address' } },
  { path: 'representative', select: 'fullName email phone' },
  { path: 'otherMembers', select: 'fullName email phone' },
  'rentalRequest',
  { path: 'template', select: 'title status' },
  { path: 'createdBy', select: 'fullName email' },
];

/**
 * Kiểm tra mẫu hợp đồng dùng được cho nhà trọ: phải đang dùng (active)
 * và do chủ của nhà trọ đó tạo (manager chỉ dùng mẫu của chủ trọ mình được giao).
 */
const resolveTemplateForProperty = async (templateId, propertyId) => {
  const template = await ContractTemplates.findById(templateId);
  if (!template) {
    throw { status: 404, message: 'Mẫu hợp đồng không tồn tại' };
  }
  if (template.status !== 'active') {
    throw { status: 400, message: 'Mẫu hợp đồng này đã ngừng sử dụng' };
  }
  const property = await Properties.findById(propertyId).select('owner');
  if (!property || String(property.owner) !== String(template.createdBy)) {
    throw { status: 403, message: 'Chỉ được dùng mẫu hợp đồng do chủ nhà trọ này tạo' };
  }
  return template;
};

// Các trường được phép sửa qua API cập nhật
const EDITABLE_FIELDS = ['startDate', 'endDate', 'monthlyRent', 'depositAmount', 'status', 'otherMembers', 'template'];

/** Lấy hợp đồng và kiểm tra user có quyền với nhà trọ chứa phòng của hợp đồng. */
const findContractWithAccess = async (contractId, user) => {
  const contract = await Contracts.findById(contractId);
  if (!contract) {
    throw { status: 404, message: 'Hợp đồng không tồn tại' };
  }
  const room = await Rooms.findById(contract.room).select('property');
  await assertPropertyAccess(user, room?.property);
  return contract;
};

export const getContractsByProperty = async (propertyId, user) => {
  await assertPropertyAccess(user, propertyId);

  const roomIds = await Rooms.find({ property: propertyId }).distinct('_id');
  return Contracts.find({ room: { $in: roomIds } })
    .sort({ createdAt: -1 })
    .populate(populateFields);
};

/** Dữ liệu cho form tạo hợp đồng: phòng chưa có hợp đồng, yêu cầu thuê đã duyệt, danh sách người thuê. */
export const getContractFormOptions = async (propertyId, user) => {
  await assertPropertyAccess(user, propertyId);

  const rooms = await Rooms.find({ property: propertyId }).select('roomNumber price status').sort({ roomNumber: 1 });
  const roomIds = rooms.map(r => r._id);
  const busyRoomIds = await Contracts.find({ room: { $in: roomIds }, status: 'active' }).distinct('room');
  const busy = new Set(busyRoomIds.map(String));

  const approvedRequests = await RentalRequests.find({ room: { $in: roomIds }, status: 'approved' })
    .populate('tenant', 'fullName email phone')
    .populate('room', 'roomNumber price');

  const tenants = await Users.find({ role: 'tenant', status: 'active' })
    .select('fullName email phone')
    .sort({ fullName: 1 })
    .limit(500);

  // Mẫu hợp đồng đang dùng của chủ nhà trọ (landlord tạo, manager chọn để điền)
  const property = await Properties.findById(propertyId).select('owner');
  const templates = await ContractTemplates.find({ createdBy: property?.owner, status: 'active' })
    .select('title updatedAt')
    .sort({ updatedAt: -1 });

  return {
    rooms: rooms.filter(r => !busy.has(String(r._id))),
    approvedRequests: approvedRequests.filter(r => r.room && r.tenant && !busy.has(String(r.room._id))),
    tenants,
    templates,
  };
};

export const getContractById = async (contractId, user) => {
  const contract = await findContractWithAccess(contractId, user);
  return contract.populate(populateFields);
};

/** Văn bản hợp đồng: nội dung mẫu (bản lưu lúc lập hợp đồng) đã điền dữ liệu thật. */
export const getContractDocument = async (contractId, user) => {
  const contract = await findContractWithAccess(contractId, user);
  await contract.populate([
    {
      path: 'room',
      select: 'roomNumber area property',
      populate: {
        path: 'property',
        select: 'name address owner utilityRate contractPolicy',
        populate: { path: 'owner', select: 'fullName phone' },
      },
    },
    { path: 'representative', select: 'fullName email phone' },
    { path: 'otherMembers', select: 'fullName email phone' },
    { path: 'createdBy', select: 'fullName' },
    { path: 'template', select: 'title content' },
  ]);

  // Ưu tiên bản lưu lúc lập hợp đồng, để sửa mẫu sau này không làm thay đổi hợp đồng đã ký
  const title = contract.templateTitle || contract.template?.title;
  const content = contract.templateContent || contract.template?.content;
  if (!content) {
    throw { status: 404, message: 'Hợp đồng này chưa gắn mẫu hợp đồng' };
  }

  return {
    contractId: contract._id,
    title,
    status: contract.status,
    content: fillTemplate(content, buildPlaceholderValues(contract)),
  };
};

export const createContract = async (data, user) => {
  const room = await Rooms.findById(data.room);
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }
  await assertPropertyAccess(user, room.property);

  const template = await resolveTemplateForProperty(data.template, room.property);

  const activeContract = await Contracts.findOne({ room: data.room, status: 'active' });
  if (activeContract) {
    throw { status: 400, message: 'Phòng này đã có hợp đồng hoạt động' };
  }

  const representative = await Users.findOne({ _id: data.representative, role: 'tenant' });
  if (!representative) {
    throw { status: 404, message: 'Người đại diện không tồn tại hoặc không phải người thuê' };
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

  const otherMembers = [...new Set((data.otherMembers || []).map(String))].filter(
    id => id !== String(data.representative),
  );
  if (otherMembers.length > 0) {
    const validCount = await Users.countDocuments({ _id: { $in: otherMembers }, role: 'tenant' });
    if (validCount !== otherMembers.length) {
      throw { status: 400, message: 'Có người ở cùng không tồn tại hoặc không phải người thuê' };
    }
  }

  const contract = await Contracts.create({
    room: data.room,
    rentalRequest: data.rentalRequest || undefined,
    template: template._id,
    templateTitle: template.title,
    templateContent: template.content,
    representative: data.representative,
    otherMembers,
    startDate: data.startDate,
    endDate: data.endDate,
    monthlyRent: data.monthlyRent,
    depositAmount: data.depositAmount || 0,
    status: data.status || 'active',
    createdBy: user.userId,
  });

  if (contract.status === 'active' && room.status !== 'occupied') {
    room.status = 'occupied';
    await room.save();
  }

  return contract.populate(populateFields);
};

export const updateContract = async (contractId, data, user) => {
  const contract = await findContractWithAccess(contractId, user);

  const lockedFields = ['monthlyRent', 'depositAmount'];
  for (const field of lockedFields) {
    if (data[field] !== undefined && Number(data[field]) !== contract[field] && contract.status !== 'draft') {
      throw { status: 400, message: 'Không thể chỉnh sửa tiền thuê / tiền cọc sau khi ký hợp đồng' };
    }
  }

  const previousStatus = contract.status;

  // Đổi / gắn mẫu: chỉ khi hợp đồng còn Nháp, hoặc hợp đồng cũ chưa có mẫu
  if (data.template !== undefined && String(data.template || '') !== String(contract.template || '')) {
    if (!data.template) {
      throw { status: 400, message: 'Không thể bỏ mẫu hợp đồng' };
    }
    if (contract.template && contract.status !== 'draft') {
      throw { status: 400, message: 'Chỉ đổi mẫu hợp đồng khi hợp đồng còn ở trạng thái Nháp' };
    }
    const room = await Rooms.findById(contract.room).select('property');
    const template = await resolveTemplateForProperty(data.template, room?.property);
    contract.templateTitle = template.title;
    contract.templateContent = template.content;
  } else {
    delete data.template;
  }

  if (data.otherMembers !== undefined) {
    if (!Array.isArray(data.otherMembers)) {
      throw { status: 400, message: 'Danh sách người ở cùng không hợp lệ' };
    }
    // Bỏ trùng và bỏ người đại diện khỏi danh sách người ở cùng
    const repId = String(contract.representative);
    data.otherMembers = [...new Set(data.otherMembers.map(String))].filter(id => id !== repId);
    const validCount = await Users.countDocuments({ _id: { $in: data.otherMembers }, role: 'tenant' });
    if (validCount !== data.otherMembers.length) {
      throw { status: 400, message: 'Có người ở cùng không tồn tại hoặc không phải người thuê' };
    }
  }

  if (data.status === 'active' && previousStatus !== 'active') {
    const otherActive = await Contracts.exists({ room: contract.room, status: 'active', _id: { $ne: contract._id } });
    if (otherActive) {
      throw { status: 400, message: 'Phòng này đã có hợp đồng hoạt động khác' };
    }
  }

  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) contract[field] = data[field];
  }
  await contract.save();

  // Đồng bộ trạng thái phòng theo trạng thái hợp đồng
  if (contract.status !== previousStatus) {
    const room = await Rooms.findById(contract.room);
    if (room) {
      if (contract.status === 'active' && room.status !== 'occupied') {
        room.status = 'occupied';
        await room.save();
      } else if (
        previousStatus === 'active' &&
        ['expired', 'terminated'].includes(contract.status) &&
        room.status === 'occupied'
      ) {
        room.status = 'available';
        await room.save();
      }
    }
  }

  return contract.populate(populateFields);
};

export const renewContract = async (contractId, newEndDate, user) => {
  const contract = await findContractWithAccess(contractId, user);

  if (contract.status !== 'active') {
    throw { status: 400, message: 'Chỉ có thể gia hạn hợp đồng hoạt động' };
  }

  const newEndDateObj = new Date(newEndDate);
  if (newEndDateObj <= contract.endDate) {
    throw { status: 400, message: 'Ngày kết thúc mới phải sau ngày kết thúc hiện tại' };
  }

  contract.endDate = newEndDate;
  await contract.save();

  return contract.populate(populateFields);
};

export const changeRepresentative = async (contractId, newRepresentativeId, user) => {
  const contract = await findContractWithAccess(contractId, user);

  const allMembers = [contract.representative, ...contract.otherMembers];
  const isMember = allMembers.some(member => member.toString() === newRepresentativeId);
  if (!isMember) {
    throw { status: 400, message: 'Người đại diện mới phải là thành viên của hợp đồng' };
  }

  const oldRepresentative = contract.representative;
  contract.representative = newRepresentativeId;

  if (!contract.otherMembers.some(m => m.toString() === oldRepresentative.toString())) {
    contract.otherMembers.push(oldRepresentative);
  }
  contract.otherMembers = contract.otherMembers.filter(member => member.toString() !== newRepresentativeId);

  await contract.save();

  return contract.populate(populateFields);
};

export const searchContracts = async (filters, user) => {
  if (!filters.property) {
    throw { status: 400, message: 'Thiếu mã nhà trọ (property)' };
  }
  await assertPropertyAccess(user, filters.property);

  const roomIds = await Rooms.find({ property: filters.property }).distinct('_id');
  const query = { room: { $in: roomIds } };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.room) {
    query.room = roomIds.some(id => id.toString() === filters.room) ? filters.room : null;
  }
  if (filters.representative) {
    query.representative = filters.representative;
  }

  return Contracts.find(query).sort({ createdAt: -1 }).populate(populateFields);
};
