import mongoose from 'mongoose';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Properties from '../../models/Properties.js';
import Users from '../../models/Users.js';

const SAFE_USER_FIELDS = 'fullName email phone status';

const populateFields = [
  { path: 'manager', select: SAFE_USER_FIELDS },
  { path: 'property', select: 'name address' },
  { path: 'assignedBy', select: 'fullName email' },
];

/** Chỉ chủ trọ sở hữu nhà trọ mới được giao / gỡ quản lý. */
const assertOwnProperty = async (user, propertyId) => {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw { status: 404, message: 'Nhà trọ không tồn tại' };
  }
  const property = await Properties.findOne({ _id: propertyId, owner: user.userId });
  if (!property) {
    throw { status: 403, message: 'Bạn chỉ được giao quản lý cho nhà trọ của mình!' };
  }
  return property;
};

/** Danh sách giao quản lý (đang hiệu lực) của các nhà trọ landlord sở hữu, có thể lọc theo nhà trọ. */
export const getAssignments = async (user, filters = {}) => {
  let propertyIds;
  if (filters.property) {
    await assertOwnProperty(user, filters.property);
    propertyIds = [filters.property];
  } else {
    propertyIds = await Properties.find({ owner: user.userId }).distinct('_id');
  }

  return ManagerAssignments.find({ property: { $in: propertyIds }, status: 'active' })
    .sort({ assignedAt: -1 })
    .populate(populateFields);
};

/** Tài khoản quản lý (role manager, đang hoạt động) để chọn khi giao, tìm theo tên / email / SĐT. */
export const getAvailableManagers = async (filters = {}) => {
  const assignedManagerIds = await ManagerAssignments.distinct('manager', { status: 'active' });
  const query = { role: 'manager', status: 'active', isVerified: true, _id: { $nin: assignedManagerIds } };
  const kw = String(filters.q || '').trim();
  if (kw) {
    const rx = { $regex: kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    query.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }
  return Users.find(query).select(SAFE_USER_FIELDS).sort({ fullName: 1 }).limit(100);
};

export const assignManager = async (data, user) => {
  await assertOwnProperty(user, data.property);

  if (!mongoose.isValidObjectId(data.manager)) {
    throw { status: 404, message: 'Quản lý không tồn tại' };
  }
  const manager = await Users.findOne({ _id: data.manager, role: 'manager' });
  if (!manager) {
    throw { status: 404, message: 'Tài khoản không tồn tại hoặc không phải quản lý' };
  }
  if (manager.status !== 'active') {
    throw { status: 400, message: 'Tài khoản quản lý đang bị khóa' };
  }
  if (!manager.isVerified) {
    throw { status: 400, message: 'Quản lý viên cần xác thực tài khoản trước khi được phân công' };
  }

  const existing = await ManagerAssignments.findOne({ manager: data.manager, status: 'active' });
  if (existing) {
    const sameProperty = String(existing.property) === String(data.property);
    throw { status: 409, message: sameProperty ? 'Quản lý này đã được giao nhà trọ này' : 'Quản lý này đã được phân công một nhà trọ khác' };
  }

  const assignment = await ManagerAssignments.create({
    manager: data.manager,
    property: data.property,
    assignedBy: user.userId,
  });
  return assignment.populate(populateFields);
};

export const removeAssignment = async (assignmentId, user) => {
  if (!mongoose.isValidObjectId(assignmentId)) {
    throw { status: 404, message: 'Bản ghi giao quản lý không tồn tại' };
  }
  const assignment = await ManagerAssignments.findById(assignmentId);
  if (!assignment || assignment.status !== 'active') {
    throw { status: 404, message: 'Bản ghi giao quản lý không tồn tại' };
  }
  await assertOwnProperty(user, assignment.property);

  assignment.status = 'removed';
  assignment.removedAt = new Date();
  await assignment.save();
  return assignment.populate(populateFields);
};
