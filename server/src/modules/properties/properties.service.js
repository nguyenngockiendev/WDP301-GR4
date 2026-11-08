import Rooms from '../../models/Rooms.js';
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
        image: room.images?.[0] || '/images/haven-room-1.jpg', amenities: room.facilities || [],
      })),
    };
  });
};
