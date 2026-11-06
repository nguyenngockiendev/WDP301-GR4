import mongoose from 'mongoose';
import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';

/**
 * Nhà trọ mà user được quản lý:
 * - landlord: các nhà trọ mình sở hữu
 * - manager: các nhà trọ được giao (assignment đang active)
 */
export const getMyProperties = async ({ userId, role }) => {
  if (role === 'landlord') {
    return Properties.find({ owner: userId }).sort({ createdAt: 1 });
  }

  if (role === 'manager') {
    const assignments = await ManagerAssignments.find({ manager: userId, status: 'active' }).select('property');
    const propertyIds = assignments.map(a => a.property);
    return Properties.find({ _id: { $in: propertyIds } }).sort({ createdAt: 1 });
  }

  throw { status: 403, message: 'Bạn không có quyền truy cập!' };
};

/**
 * Kiểm tra user có quyền quản lý nhà trọ không (landlord sở hữu / manager được giao).
 * Ném lỗi 403/404 nếu không có quyền.
 */
export const assertPropertyAccess = async ({ userId, role }, propertyId) => {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw { status: 404, message: 'Nhà trọ không tồn tại' };
  }

  if (role === 'landlord') {
    const owned = await Properties.exists({ _id: propertyId, owner: userId });
    if (owned) return;
  } else if (role === 'manager') {
    const assigned = await ManagerAssignments.exists({ manager: userId, property: propertyId, status: 'active' });
    if (assigned) return;
  }

  throw { status: 403, message: 'Bạn không có quyền quản lý nhà trọ này!' };
};
