import mongoose from 'mongoose';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';

const roomFloor = roomNumber => {
  const match = String(roomNumber).match(/^(\d+)\d{2}$/);
  return match ? Number(match[1]) : 1;
};

export const getPublicProperties = async () => {
  const properties = await Properties.find({ status: 'active' })
    .select('name address description utilityRate')
    .sort({ createdAt: 1 })
    .lean();
  if (!properties.length) return [];

  const rooms = await Rooms.find({ property: { $in: properties.map(property => property._id) } })
    .select('property roomNumber area price tier facilities images status description')
    .sort({ roomNumber: 1 })
    .lean();

  return properties.map((property, index) => {
    const propertyRooms = rooms.filter(room => String(room.property) === String(property._id));
    const availableRooms = propertyRooms.filter(room => room.status === 'available').length;
    const occupiedRooms = propertyRooms.filter(room => room.status === 'occupied').length;
    const reservedRooms = propertyRooms.filter(room => room.status === 'reserved').length;
    const totalFloors = Math.max(0, ...propertyRooms.map(room => roomFloor(room.roomNumber)));

    return {
      id: String(property._id),
      name: property.name,
      code: `TÒA ${index + 1}`,
      address: property.address,
      district: property.address.split(',').slice(-2, -1)[0]?.trim() || '',
      description: property.description || '',
      totalFloors,
      totalRooms: propertyRooms.length,
      availableRooms,
      occupiedRooms,
      reservedRooms,
      occupancyRate: propertyRooms.length
        ? Math.round((occupiedRooms / propertyRooms.length) * 100)
        : 0,
      electricPrice: property.utilityRate?.electricityPrice || 0,
      waterPrice: property.utilityRate?.waterPrice || 0,
      rooms: propertyRooms
        .filter(room => room.status !== 'maintenance')
        .map(room => ({
          id: String(room._id),
          roomNumber: `Phòng ${room.roomNumber}`,
          floor: roomFloor(room.roomNumber),
          name: room.description?.trim() || `Phòng ${room.roomNumber}`,
          tier: { basic: 'Phòng cơ bản', standard: 'Phòng tiêu chuẩn', premium: 'Phòng cao cấp' }[
            room.tier
          ] || 'Phòng tiêu chuẩn',
          area: `${room.area}m²`,
          price: room.price,
          status: room.status,
          image: room.images?.[0] || '',
          amenities: room.facilities || [],
        })),
    };
  });
};

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
