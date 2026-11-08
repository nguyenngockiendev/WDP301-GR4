import mongoose from 'mongoose';
import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Rooms from '../../models/Rooms.js';

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

/**
 * Danh sách nhà trọ đang hoạt động kèm phòng, cho người thuê xem ở trang Home.
 * Chỉ trả các trường công khai (không có thông tin hợp đồng / người thuê).
 */
export const getBrowseProperties = async () => {
  const properties = await Properties.find({ status: 'active' })
    .select('name address description utilityRate contractPolicy owner')
    .populate('owner', 'fullName phone')
    .sort({ createdAt: 1 })
    .lean();
  const propertyIds = properties.map(p => p._id);

  const [rooms, assignments] = await Promise.all([
    Rooms.find({ property: { $in: propertyIds } })
      .select('property roomNumber area price maxTenants facilities description images status')
      .sort({ roomNumber: 1 })
      .lean(),
    ManagerAssignments.find({ property: { $in: propertyIds }, status: 'active' })
      .populate('manager', 'fullName phone status')
      .lean(),
  ]);

  return properties.map(p => {
    const id = String(p._id);
    const managers = assignments
      .filter(a => String(a.property) === id && a.manager?.status === 'active')
      .map(a => ({ fullName: a.manager.fullName, phone: a.manager.phone }));
    return {
      _id: p._id,
      name: p.name,
      address: p.address,
      description: p.description,
      utilityRate: { electricityPrice: p.utilityRate?.electricityPrice, waterPrice: p.utilityRate?.waterPrice },
      depositMonths: p.contractPolicy?.depositMonths,
      contact: managers[0] || (p.owner ? { fullName: p.owner.fullName, phone: p.owner.phone } : null),
      rooms: rooms.filter(r => String(r.property) === id).map(({ property, ...r }) => r),
    };
  });
};
