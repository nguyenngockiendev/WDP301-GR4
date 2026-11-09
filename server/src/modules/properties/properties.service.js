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
export const assertPropertyAccess = async ({ userId, role }, propertyId, session = null) => {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw { status: 404, message: 'Nhà trọ không tồn tại' };
  }

  if (role === 'landlord') {
    const owned = await Properties.exists({ _id: propertyId, owner: userId }).session(session);
    if (owned) return;
  } else if (role === 'manager') {
    const assigned = await ManagerAssignments.exists({ manager: userId, property: propertyId, status: 'active' }).session(session);
    if (assigned) return;
  }

  throw { status: 403, message: 'Bạn không có quyền quản lý nhà trọ này!' };
};


// Public catalogue: never expose owner, tenant, contract or account information.
export const getPublicProperties = async () => {
  const properties = await Properties.find({ status: 'active' })
    .select('name address description image district code totalFloors utilityRate').sort({ createdAt: 1 }).lean();
  const rooms = await Rooms.find({ property: { $in: properties.map(p => p._id) } })
    .select('property roomNumber name floor tier area price status images facilities').sort({ roomNumber: 1 }).lean();
  return properties.map(property => {
    const propertyRooms = rooms.filter(room => String(room.property) === String(property._id));
    const count = status => propertyRooms.filter(room => room.status === status).length;
    return {
      id: String(property._id), name: property.name, address: property.address,
      description: property.description, image: property.image || '/images/haven-building-1.jpg',
      district: property.district || property.address, code: property.code || property.name,
      totalFloors: Math.max(property.totalFloors || 1, ...propertyRooms.map(room => room.floor ?? 1)),
      totalRooms: propertyRooms.length, availableRooms: count('available'),
      occupiedRooms: count('occupied'), reservedRooms: count('reserved'),
      occupancyRate: propertyRooms.length ? Math.round(count('occupied') * 100 / propertyRooms.length) : 0,
      electricPrice: property.utilityRate?.electricityPrice || 0,
      waterPrice: property.utilityRate?.waterPrice || 0,
      manager: 'Liên hệ chủ trọ',
      rooms: propertyRooms.map(room => ({
        id: String(room._id), roomNumber: room.roomNumber, name: room.name || room.roomNumber,
        floor: room.floor ?? 1, tier: ({ basic: 'Cơ bản', standard: 'Tiêu chuẩn', premium: 'Cao cấp' })[room.tier],
        area: room.area + 'm²', price: room.price, status: room.status,
        image: room.images?.[0] || '', amenities: room.facilities || [],
      })),
    };
  });
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
