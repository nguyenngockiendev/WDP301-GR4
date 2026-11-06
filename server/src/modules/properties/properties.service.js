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
