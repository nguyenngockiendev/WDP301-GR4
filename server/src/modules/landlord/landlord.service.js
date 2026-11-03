import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Users from '../../models/Users.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import Services from '../../models/Services.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';

const fail = (status, message) => { throw { status, message }; };
const objectId = id => mongoose.Types.ObjectId.isValid(id);
const safeUser = user => ({
  id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone || '',
  role: user.role,
  status: user.status,
});

export async function ownedProperty(userId, propertyId) {
  if (!objectId(propertyId)) fail(400, 'Mã nhà trọ không hợp lệ.');
  const property = await Properties.findOne({ _id: propertyId, owner: userId });
  if (!property) fail(404, 'Không tìm thấy nhà trọ thuộc quyền sở hữu của bạn.');
  return property;
}

export async function listProperties(userId) {
  return Properties.find({ owner: userId }).sort({ createdAt: -1 });
}

export async function createProperty(userId, data) {
  const name = String(data.name || '').trim();
  const address = String(data.address || '').trim();
  if (name.length < 2 || address.length < 5) fail(400, 'Tên nhà trọ hoặc địa chỉ chưa hợp lệ.');
  const electricityPrice = data.electricityPrice === undefined || data.electricityPrice === '' ? 0 : Number(data.electricityPrice);
  const waterPrice = data.waterPrice === undefined || data.waterPrice === '' ? 0 : Number(data.waterPrice);
  const paymentDueDay = data.paymentDueDay === undefined || data.paymentDueDay === '' ? 5 : Number(data.paymentDueDay);
  const paymentGraceDays = data.paymentGraceDays === undefined || data.paymentGraceDays === '' ? 3 : Number(data.paymentGraceDays);
  const depositMonths = data.depositMonths === undefined || data.depositMonths === '' ? 1 : Number(data.depositMonths);
  if (!Number.isFinite(electricityPrice) || electricityPrice < 0 || !Number.isFinite(waterPrice) || waterPrice < 0) {
    fail(400, 'Đơn giá điện và nước phải là số không âm.');
  }
  if (!Number.isInteger(paymentDueDay) || paymentDueDay < 1 || paymentDueDay > 28) fail(400, 'Ngày đến hạn phải từ ngày 1 đến ngày 28.');
  if (!Number.isInteger(paymentGraceDays) || paymentGraceDays < 0 || paymentGraceDays > 60) fail(400, 'Thời gian gia hạn phải từ 0 đến 60 ngày.');
  if (!Number.isFinite(depositMonths) || depositMonths < 0 || depositMonths > 12) fail(400, 'Số tháng tiền cọc phải từ 0 đến 12.');
  const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();
  if (Number.isNaN(effectiveFrom.getTime())) fail(400, 'Ngày bắt đầu áp dụng không hợp lệ.');
  return Properties.create({
    owner: userId, name, address, description: String(data.description || '').trim(),
    utilityRate: { electricityPrice, waterPrice, effectiveFrom },
    contractPolicy: {
      paymentDueDay, paymentGraceDays, depositMonths,
      policyNote: String(data.policyNote || '').trim().slice(0, 2000),
    },
  });
}

export async function updateProperty(userId, propertyId, data) {
  const property = await ownedProperty(userId, propertyId);
  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (name.length < 2) fail(400, 'Tên nhà trọ phải có ít nhất 2 ký tự.');
    property.name = name;
  }
  if (data.address !== undefined) {
    const address = String(data.address).trim();
    if (address.length < 5) fail(400, 'Địa chỉ phải có ít nhất 5 ký tự.');
    property.address = address;
  }
  if (data.description !== undefined) property.description = String(data.description).trim();
  await property.save();
  return property;
}

export async function setPropertyStatus(userId, propertyId, status) {
  if (!['active', 'inactive'].includes(status)) fail(400, 'Trạng thái nhà trọ không hợp lệ.');
  const property = await ownedProperty(userId, propertyId);
  if (status === 'inactive') {
    const [occupiedRoom, activeContract] = await Promise.all([
      Rooms.exists({ property: property._id, status: { $in: ['occupied', 'reserved'] } }),
      Contracts.exists({ property: property._id, status: 'active' }),
    ]);
    if (occupiedRoom || activeContract) fail(409, 'Không thể ngừng hoạt động khi nhà trọ còn hợp đồng hoặc phòng đang có người thuê.');
  }
  property.status = status;
  await property.save();
  return property;
}

export async function listManagers(userId) {
  const propertyIds = await Properties.distinct('_id', { owner: userId });
  const assignedManagerIds = await ManagerAssignments.distinct('manager', { property: { $in: propertyIds }, status: 'active' });
  return Users.find({ role: 'manager', $or: [{ createdBy: userId }, { _id: { $in: assignedManagerIds } }] })
    .select('username email fullName phone role status createdAt').sort({ createdAt: -1 });
}

export async function createManager(userId, data) {
  const username = String(data.username || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const fullName = String(data.fullName || '').trim();
  const password = String(data.password || '');
  if (username.length < 2 || fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Hãy nhập họ tên, username và email hợp lệ.');
  if (password.length < 8) fail(400, 'Mật khẩu tạm thời phải có ít nhất 8 ký tự.');
  if (await Users.exists({ $or: [{ email }, { username }] })) fail(409, 'Email hoặc username đã được sử dụng.');
  const manager = await Users.create({
    username, email, fullName, phone: String(data.phone || '').trim(),
    password: await bcrypt.hash(password, 12), role: 'manager', status: 'active',
    isVerified: true, createdBy: userId,
  });
  return safeUser(manager);
}

export async function updateManager(userId, managerId, data) {
  if (!objectId(managerId)) fail(400, 'Mã quản lý không hợp lệ.');
  const manager = await Users.findOne({ _id: managerId, role: 'manager', createdBy: userId });
  if (!manager) fail(404, 'Không tìm thấy tài khoản quản lý của bạn.');
  if (data.fullName !== undefined) {
    const fullName = String(data.fullName).trim();
    if (fullName.length < 2) fail(400, 'Họ tên phải có ít nhất 2 ký tự.');
    manager.fullName = fullName;
  }
  if (data.phone !== undefined) manager.phone = String(data.phone).trim();
  await manager.save();
  return safeUser(manager);
}

export async function setManagerStatus(userId, managerId, status) {
  if (!objectId(managerId)) fail(400, 'Mã quản lý không hợp lệ.');
  if (!['active', 'inactive'].includes(status)) fail(400, 'Trạng thái tài khoản không hợp lệ.');
  const manager = await Users.findOne({ _id: managerId, role: 'manager', createdBy: userId });
  if (!manager) fail(404, 'Không tìm thấy tài khoản quản lý của bạn.');
  if (status === 'inactive' && await ManagerAssignments.exists({ manager: manager._id, status: 'active' })) {
    fail(409, 'Hãy gỡ quản lý khỏi các nhà trọ trước khi vô hiệu hóa tài khoản.');
  }
  manager.status = status;
  await manager.save();
  return safeUser(manager);
}

export async function listAssignments(userId) {
  const properties = await Properties.find({ owner: userId }).select('_id');
  return ManagerAssignments.find({ property: { $in: properties.map(p => p._id) }, status: 'active' })
    .populate('manager', 'username email fullName status')
    .populate('property', 'name address status')
    .sort({ assignedAt: -1 });
}

export async function assignManager(userId, managerId, propertyIds) {
  if (!objectId(managerId) || !Array.isArray(propertyIds) || propertyIds.length === 0) fail(400, 'Chọn một quản lý và ít nhất một nhà trọ.');
  const manager = await Users.findOne({ _id: managerId, role: 'manager', status: 'active' });
  if (!manager || String(manager.createdBy) !== String(userId)) fail(404, 'Không tìm thấy tài khoản quản lý đang hoạt động của bạn.');
  const uniqueIds = [...new Set(propertyIds.map(String))];
  if (uniqueIds.some(id => !objectId(id))) fail(400, 'Có mã nhà trọ không hợp lệ.');
  const owned = await Properties.find({ _id: { $in: uniqueIds }, owner: userId }).select('_id');
  if (owned.length !== uniqueIds.length) fail(403, 'Bạn chỉ có thể phân công nhà trọ thuộc sở hữu của mình.');
  for (const property of owned) {
    const existing = await ManagerAssignments.findOne({ manager: manager._id, property: property._id });
    if (existing?.status === 'active') continue;
    if (existing) {
      existing.status = 'active'; existing.assignedBy = userId; existing.assignedAt = new Date(); existing.removedAt = null;
      await existing.save();
    } else {
      await ManagerAssignments.create({ manager: manager._id, property: property._id, assignedBy: userId });
    }
  }
  return listAssignments(userId);
}

export async function removeAssignment(userId, assignmentId) {
  if (!objectId(assignmentId)) fail(400, 'Mã phân công không hợp lệ.');
  const propertyIds = await Properties.distinct('_id', { owner: userId });
  const assignment = await ManagerAssignments.findOne({ _id: assignmentId, property: { $in: propertyIds }, status: 'active' });
  if (!assignment) fail(404, 'Không tìm thấy phân công đang hoạt động.');
  assignment.status = 'removed'; assignment.removedAt = new Date();
  await assignment.save();
  return assignment;
}

export async function configureRates(userId, propertyId, data) {
  const property = await ownedProperty(userId, propertyId);
  const electricityPrice = Number(data.electricityPrice);
  const waterPrice = Number(data.waterPrice);
  if (!Number.isFinite(electricityPrice) || electricityPrice < 0 || !Number.isFinite(waterPrice) || waterPrice < 0) {
    fail(400, 'Đơn giá điện và nước phải là số không âm.');
  }
  const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();
  if (Number.isNaN(effectiveFrom.getTime())) fail(400, 'Ngày áp dụng không hợp lệ.');
  property.utilityRate = { electricityPrice, waterPrice, effectiveFrom };
  await property.save();
  return property.utilityRate;
}

export async function configurePolicy(userId, propertyId, data) {
  const property = await ownedProperty(userId, propertyId);
  const currentPolicy = property.contractPolicy;
  const policy = currentPolicy && typeof currentPolicy.toObject === 'function'
    ? currentPolicy.toObject()
    : { ...(currentPolicy || {}) };
  if (data.paymentDueDay !== undefined) {
    const day = Number(data.paymentDueDay);
    if (!Number.isInteger(day) || day < 1 || day > 28) fail(400, 'Ngày đến hạn phải từ ngày 1 đến ngày 28.');
    policy.paymentDueDay = day;
  }
  if (data.paymentGraceDays !== undefined) {
    const days = Number(data.paymentGraceDays);
    if (!Number.isInteger(days) || days < 0 || days > 60) fail(400, 'Thời gian gia hạn phải từ 0 đến 60 ngày.');
    policy.paymentGraceDays = days;
  }
  if (data.depositMonths !== undefined) {
    const months = Number(data.depositMonths);
    if (!Number.isFinite(months) || months < 0 || months > 12) fail(400, 'Số tháng tiền cọc phải từ 0 đến 12.');
    policy.depositMonths = months;
  }
  if (data.policyNote !== undefined) policy.policyNote = String(data.policyNote).trim().slice(0, 2000);
  property.contractPolicy = policy;
  await property.save();
  return property.contractPolicy;
}

export async function listServices(userId, propertyId) {
  const property = await ownedProperty(userId, propertyId);
  return Services.find({ property: property._id }).sort({ name: 1 });
}

export async function saveService(userId, propertyId, serviceId, data) {
  const property = await ownedProperty(userId, propertyId);
  const name = String(data.name || '').trim();
  const unitPrice = Number(data.unitPrice);
  if (name.length < 2 || !Number.isFinite(unitPrice) || unitPrice < 0) fail(400, 'Tên dịch vụ hoặc đơn giá không hợp lệ.');
  if (!['fixed', 'per_room', 'per_person'].includes(data.unitType || 'fixed')) fail(400, 'Đơn vị tính dịch vụ không hợp lệ.');
  const duplicate = await Services.exists({ property: property._id, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, ...(serviceId ? { _id: { $ne: serviceId } } : {}) });
  if (duplicate) fail(409, 'Dịch vụ cùng tên đã tồn tại trong nhà trọ.');
  let service;
  if (serviceId) {
    if (!objectId(serviceId)) fail(400, 'Mã dịch vụ không hợp lệ.');
    service = await Services.findOne({ _id: serviceId, property: property._id });
    if (!service) fail(404, 'Không tìm thấy dịch vụ.');
    service.name = name; service.description = String(data.description || '').trim();
    service.unitPrice = unitPrice; service.unitType = data.unitType || 'fixed';
    if (data.status !== undefined) service.status = data.status;
    await service.save();
  } else {
    service = await Services.create({ property: property._id, name, unitPrice, unitType: data.unitType || 'fixed', description: String(data.description || '').trim() });
  }
  return service;
}

export async function setServiceStatus(userId, propertyId, serviceId, status) {
  const property = await ownedProperty(userId, propertyId);
  if (!['active', 'inactive'].includes(status)) fail(400, 'Trạng thái dịch vụ không hợp lệ.');
  const service = await Services.findOneAndUpdate({ _id: serviceId, property: property._id }, { $set: { status } }, { new: true, runValidators: true });
  if (!service) fail(404, 'Không tìm thấy dịch vụ.');
  return service;
}

export async function listPropertyRooms(userId, propertyId) {
  const property = await ownedProperty(userId, propertyId);
  return Rooms.find({ property: property._id }).select('roomNumber price status area').sort({ roomNumber: 1 });
}

export async function setRoomPrice(userId, propertyId, roomId, price) {
  const property = await ownedProperty(userId, propertyId);
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) fail(400, 'Giá thuê phải lớn hơn 0.');
  const room = await Rooms.findOneAndUpdate({ _id: roomId, property: property._id }, { $set: { price: amount } }, { new: true, runValidators: true });
  if (!room) fail(404, 'Không tìm thấy phòng thuộc nhà trọ.');
  return room;
}
