import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import { assertPropertyAccess } from '../properties/properties.service.js';

/** Lấy phòng và kiểm tra user có quyền với nhà trọ chứa phòng. */
const findRoomWithAccess = async (roomId, user) => {
  const room = await Rooms.findById(roomId);
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }
  await assertPropertyAccess(user, room.property);
  return room;
};

export const getRoomsByProperty = async (propertyId, user) => {
  await assertPropertyAccess(user, propertyId);
  const rooms = await Rooms.find({ property: propertyId }).populate('property');
  return rooms;
};

export const getRoomById = async (roomId) => {
  const room = await Rooms.findById(roomId).populate('property');
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }
  return room;
};

export const createRoom = async (data, user) => {
  const { property, roomNumber } = data;
  await assertPropertyAccess(user, property);

  const existingRoom = await Rooms.findOne({ property, roomNumber });
  if (existingRoom) {
    throw { status: 400, message: 'Số phòng đã tồn tại trong tòa nhà này' };
  }

  const room = await Rooms.create(data);
  return room.populate('property');
};

export const updateRoom = async (roomId, data, user) => {
  const room = await findRoomWithAccess(roomId, user);

  // Không cho chuyển phòng sang nhà trọ mà user không quản lý
  if (data.property && String(data.property) !== String(room.property)) {
    await assertPropertyAccess(user, data.property);
  }

  const { roomNumber, property } = data;
  if (roomNumber && roomNumber !== room.roomNumber) {
    const existingRoom = await Rooms.findOne({ property: property || room.property, roomNumber });
    if (existingRoom) {
      throw { status: 400, message: 'Số phòng đã tồn tại trong tòa nhà này' };
    }
  }

  Object.assign(room, data);
  await room.save();
  return room.populate('property');
};

export const updateRoomStatus = async (roomId, status, user) => {
  const room = await findRoomWithAccess(roomId, user);

  if (status === 'available') {
    const activeContract = await Contracts.findOne({ room: roomId, status: 'active' });
    if (activeContract) {
      throw { status: 400, message: 'Không thể đặt phòng khả dụng khi còn hợp đồng hoạt động' };
    }
  }

  room.status = status;
  await room.save();
  return room;
};

export const deactivateRoom = async (roomId, user) => {
  const room = await findRoomWithAccess(roomId, user);

  const activeContract = await Contracts.findOne({ room: roomId, status: 'active' });
  if (activeContract) {
    throw { status: 400, message: 'Không thể vô hiệu hóa phòng khi còn hợp đồng hoạt động' };
  }

  room.status = 'maintenance';
  await room.save();
  return room;
};

export const searchAvailableRooms = async (filters) => {
  const query = { status: 'available' };

  if (filters.property) {
    query.property = filters.property;
  }

  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
  }

  const rooms = await Rooms.find(query).populate('property');
  return rooms;
};
