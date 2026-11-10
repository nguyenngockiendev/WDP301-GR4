import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import Assets from '../../models/Assets.js';
import Properties from '../../models/Properties.js';
import mongoose from 'mongoose';
import { assertPropertyAccess } from '../properties/properties.service.js';

const syncRoomAssets = async (propertyId, roomId, assetIds) => {
  if (!Array.isArray(assetIds)) {
    throw { status: 400, message: 'Danh sách thiết bị của phòng không hợp lệ.' };
  }
  const uniqueIds = [...new Set(assetIds.map(String))];
  if (uniqueIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
    throw { status: 400, message: 'Mã thiết bị không hợp lệ.' };
  }

  const currentAssets = await Assets.find({ property: propertyId, room: roomId });
  const requestedAssets = uniqueIds.length
    ? await Assets.find({ _id: { $in: uniqueIds }, property: propertyId })
    : [];
  if (requestedAssets.length !== uniqueIds.length) {
    throw { status: 400, message: 'Có thiết bị không thuộc tòa nhà này.' };
  }
  if (requestedAssets.some(asset => asset.status === 'retired' || (asset.room && String(asset.room) !== String(roomId)))) {
    throw { status: 409, message: 'Thiết bị đã ngừng sử dụng hoặc đang được gán cho phòng khác.' };
  }

  const selected = new Set(uniqueIds);
  const removed = currentAssets.filter(asset => !selected.has(String(asset._id)));
  for (const asset of removed) {
    asset.room = null;
    if (asset.status === 'in_use') asset.status = 'in_stock';
    await asset.save();
  }
  for (const asset of requestedAssets) {
    asset.room = roomId;
    if (asset.status === 'in_stock') asset.status = 'in_use';
    await asset.save();
  }
};

const validateNewRoomAssets = async (propertyId, assetIds) => {
  if (!Array.isArray(assetIds)) {
    throw { status: 400, message: 'Danh sách thiết bị của phòng không hợp lệ.' };
  }
  const uniqueIds = [...new Set(assetIds.map(String))];
  if (uniqueIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
    throw { status: 400, message: 'Mã thiết bị không hợp lệ.' };
  }
  if (!uniqueIds.length) return;
  const assets = await Assets.find({ _id: { $in: uniqueIds }, property: propertyId });
  if (assets.length !== uniqueIds.length || assets.some(asset => asset.room || asset.status === 'retired')) {
    throw { status: 409, message: 'Có thiết bị không thuộc tòa nhà này, đã ngừng sử dụng hoặc đang được gán cho phòng khác.' };
  }
};

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

export const getRoomById = async roomId => {
  const room = await Rooms.findById(roomId).populate('property', 'name address image utilityRate');
  if (!room) {
    throw { status: 404, message: 'Phòng không tồn tại' };
  }
  return room;
};

export const createRoom = async (data, user) => {
  const { property, roomNumber, assetIds, ...roomData } = data;
  await assertPropertyAccess(user, property);

  const propertyData = await Properties.findById(property).select('totalFloors');
  const floor = Number(roomData.floor ?? 1);
  if (floor > Number(propertyData?.totalFloors || 1)) {
    throw { status: 400, message: `Tòa nhà chỉ có ${Number(propertyData?.totalFloors || 1)} tầng.` };
  }
  if (await Rooms.countDocuments({ property }) >= 20) {
    throw { status: 409, message: 'Mỗi tòa nhà chỉ được tạo tối đa 20 phòng.' };
  }

  const existingRoom = await Rooms.findOne({ property, roomNumber });
  if (existingRoom) {
    throw { status: 400, message: 'Số phòng đã tồn tại trong tòa nhà này' };
  }

  if (assetIds !== undefined) await validateNewRoomAssets(property, assetIds);
  const room = await Rooms.create({ ...roomData, property, roomNumber });
  if (assetIds !== undefined) await syncRoomAssets(property, room._id, assetIds);
  return room.populate('property');
};

export const updateRoom = async (roomId, data, user) => {
  const room = await findRoomWithAccess(roomId, user);

  // Older clients may send a populated property; authorize its ID.
  const targetProperty = data.property?._id || data.property || room.property;
  if (String(targetProperty) !== String(room.property)) await assertPropertyAccess(user, targetProperty);
  const propertyData = await Properties.findById(targetProperty).select('totalFloors');
  const floor = Number(data.floor ?? room.floor ?? 1);
  if (floor > Number(propertyData?.totalFloors || 1)) {
    throw { status: 400, message: `Tòa nhà chỉ có ${Number(propertyData?.totalFloors || 1)} tầng.` };
  }
  const roomNumber = data.roomNumber === undefined ? room.roomNumber : String(data.roomNumber).trim();
  if (!roomNumber) throw { status: 400, message: 'Số phòng không được để trống' };
  const duplicate = await Rooms.exists({ property: targetProperty, roomNumber, _id: { $ne: room._id } });
  if (duplicate) throw { status: 400, message: 'Số phòng đã tồn tại trong tòa nhà này' };
  const editable = ['roomNumber', 'area', 'price', 'maxTenants', 'description', 'facilities', 'images', 'tier', 'name', 'floor'];
  for (const field of editable) {
    if (data[field] !== undefined) room[field] = field === 'roomNumber' ? roomNumber : data[field];
  }
  room.property = targetProperty;
  await room.save();
  if (data.assetIds !== undefined) await syncRoomAssets(room.property, room._id, data.assetIds);
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

export const searchAvailableRooms = async filters => {
  const query = { status: 'available' };

  if (filters.property) {
    query.property = filters.property;
  }

  const minPrice =
    filters.minPrice === undefined || filters.minPrice === ''
      ? undefined
      : Number(filters.minPrice);
  const maxPrice =
    filters.maxPrice === undefined || filters.maxPrice === ''
      ? undefined
      : Number(filters.maxPrice);
  if (minPrice !== undefined && !Number.isFinite(minPrice)) {
    throw { status: 400, message: 'Giá tối thiểu không hợp lệ.' };
  }
  if (maxPrice !== undefined && !Number.isFinite(maxPrice)) {
    throw { status: 400, message: 'Giá tối đa không hợp lệ.' };
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw { status: 400, message: 'Giá tối thiểu không được lớn hơn giá tối đa.' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  if (filters.tier) {
    if (!['basic', 'standard', 'premium'].includes(filters.tier)) {
      throw { status: 400, message: 'Hạng phòng không hợp lệ.' };
    }
    query.tier = filters.tier;
  }

  const rooms = await Rooms.find(query).populate('property', 'name address image utilityRate');
  return rooms;
};
