import mongoose from 'mongoose';
import Assets from '../../models/Assets.js';
import MaintenanceTickets from '../../models/MaintenanceTickets.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';

const fail = (status, message) => { throw { status, message }; };
const idIsValid = id => mongoose.Types.ObjectId.isValid(id);

async function accessibleProperty(user, propertyId) {
  if (!idIsValid(propertyId)) fail(400, 'Mã nhà trọ không hợp lệ.');
  const query = user.role === 'landlord'
    ? { _id: propertyId, owner: user.userId }
    : user.role === 'manager' && await ManagerAssignments.exists({ manager: user.userId, property: propertyId, status: 'active' })
      ? { _id: propertyId }
      : null;
  if (!query) fail(403, 'Bạn không được quản lý nhà trọ này.');
  const property = await Properties.findOne(query);
  if (!property) fail(404, 'Không tìm thấy nhà trọ.');
  return property;
}

async function propertyRoom(propertyId, roomId) {
  if (!idIsValid(roomId)) fail(400, 'Mã phòng không hợp lệ.');
  const room = await Rooms.findOne({ _id: roomId, property: propertyId });
  if (!room) fail(404, 'Phòng không thuộc nhà trọ này.');
  return room;
}

export async function listAssets(user, propertyId) {
  await accessibleProperty(user, propertyId);
  return Assets.find({ property: propertyId }).populate('room', 'roomNumber').sort({ status: 1, name: 1 });
}

export async function listRooms(user, propertyId) {
  await accessibleProperty(user, propertyId);
  return Rooms.find({ property: propertyId }).select('roomNumber area tier status').sort({ roomNumber: 1 });
}

export async function createAsset(user, propertyId, data) {
  await accessibleProperty(user, propertyId);
  const name = String(data.name || '').trim();
  const category = String(data.category || '').trim();
  const purchasePrice = Number(data.purchasePrice || 0);
  if (name.length < 2 || category.length < 2) fail(400, 'Tên và nhóm thiết bị cần có ít nhất 2 ký tự.');
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) fail(400, 'Giá mua phải là số không âm.');
  const status = data.status || (data.room ? 'in_use' : 'in_stock');
  if (!['in_stock', 'in_use', 'maintenance', 'retired'].includes(status)) fail(400, 'Trạng thái thiết bị không hợp lệ.');
  const room = data.room ? await propertyRoom(propertyId, data.room) : null;
  if (status === 'in_use' && !room) fail(400, 'Thiết bị đang sử dụng cần được gán cho một phòng.');
  const asset = await Assets.create({
    property: propertyId, room: room?._id || null, name, category,
    brand: String(data.brand || '').trim(), model: String(data.model || '').trim(),
    assetCode: String(data.assetCode || '').trim(), purchaseDate: data.purchaseDate || null,
    warrantyExpiryDate: data.warrantyExpiryDate || null, purchasePrice,
    status, note: String(data.note || '').trim(),
    createdBy: user.userId,
  });
  return asset.populate('room', 'roomNumber');
}

export async function updateAsset(user, propertyId, assetId, data) {
  await accessibleProperty(user, propertyId);
  if (!idIsValid(assetId)) fail(400, 'Mã thiết bị không hợp lệ.');
  const asset = await Assets.findOne({ _id: assetId, property: propertyId });
  if (!asset) fail(404, 'Không tìm thấy thiết bị.');
  const editable = ['name', 'category', 'brand', 'model', 'assetCode', 'purchaseDate', 'warrantyExpiryDate', 'purchasePrice', 'status', 'note'];
  for (const key of editable) if (Object.hasOwn(data, key)) asset[key] = data[key];
  if (Object.hasOwn(data, 'room')) asset.room = data.room ? (await propertyRoom(propertyId, data.room))._id : null;
  if (asset.status === 'in_use' && !asset.room) fail(400, 'Thiết bị đang sử dụng cần được gán cho một phòng.');
  if (!['in_stock', 'in_use', 'maintenance', 'retired'].includes(asset.status)) fail(400, 'Trạng thái thiết bị không hợp lệ.');
  if (!Number.isFinite(Number(asset.purchasePrice)) || Number(asset.purchasePrice) < 0) fail(400, 'Giá mua phải là số không âm.');
  await asset.save();
  return asset.populate('room', 'roomNumber');
}

export async function listMaintenance(user, propertyId, status) {
  await accessibleProperty(user, propertyId);
  const query = { property: propertyId };
  if (status && status !== 'all') query.status = status;
  return MaintenanceTickets.find(query)
    .populate('room', 'roomNumber')
    .populate('asset', 'name assetCode status')
    .populate('reportedBy', 'fullName phone')
    .sort({ createdAt: -1 });
}

export async function createMaintenance(user, propertyId, data) {
  await accessibleProperty(user, propertyId);
  const room = await propertyRoom(propertyId, data.room);
  const title = String(data.title || '').trim();
  const category = String(data.category || '').trim();
  const description = String(data.description || '').trim();
  if (title.length < 3 || category.length < 2 || description.length < 5) fail(400, 'Vui lòng nhập tiêu đề, nhóm và mô tả sự cố đầy đủ.');
  const estimatedCost = Number(data.estimatedCost || 0);
  if (!Number.isFinite(estimatedCost) || estimatedCost < 0) fail(400, 'Chi phí dự kiến phải là số không âm.');
  let asset = null;
  if (data.asset) {
    if (!idIsValid(data.asset)) fail(400, 'Mã thiết bị không hợp lệ.');
    asset = await Assets.findOne({ _id: data.asset, property: propertyId });
    if (!asset || (asset.room && String(asset.room) !== String(room._id))) fail(400, 'Thiết bị không thuộc phòng được chọn.');
    if (asset.status === 'maintenance') fail(409, 'Thiết bị đang có yêu cầu bảo trì chưa hoàn tất.');
  }
  const ticket = await MaintenanceTickets.create({
    property: propertyId, room: room._id, asset: asset?._id || null, title, category, description,
    priority: ['low', 'normal', 'high', 'urgent'].includes(data.priority) ? data.priority : 'normal',
    estimatedCost, reportedBy: user.userId, assignedTo: String(data.assignedTo || '').trim(),
  });
  if (asset) { asset.status = 'maintenance'; await asset.save(); }
  return ticket.populate(['room', 'asset', 'reportedBy']);
}

export async function updateMaintenance(user, propertyId, ticketId, data) {
  await accessibleProperty(user, propertyId);
  if (!idIsValid(ticketId)) fail(400, 'Mã yêu cầu bảo trì không hợp lệ.');
  const ticket = await MaintenanceTickets.findOne({ _id: ticketId, property: propertyId }).populate('asset');
  if (!ticket) fail(404, 'Không tìm thấy yêu cầu bảo trì.');
  const transitions = {
    reported: ['approved', 'rejected'], approved: ['in_progress', 'rejected'],
    in_progress: ['completed'], completed: [], rejected: [],
  };
  if (data.status && data.status !== ticket.status) {
    if (!transitions[ticket.status]?.includes(data.status)) fail(409, 'Trạng thái yêu cầu không thể chuyển theo bước này.');
    ticket.status = data.status;
    if (data.status === 'completed') ticket.completedAt = new Date();
    if (['completed', 'rejected'].includes(data.status) && ticket.asset?.status === 'maintenance') {
      ticket.asset.status = ticket.asset.room ? 'in_use' : 'in_stock';
      await ticket.asset.save();
    }
  }
  if (data.priority !== undefined) {
    if (!['low', 'normal', 'high', 'urgent'].includes(data.priority)) fail(400, 'Mức độ ưu tiên không hợp lệ.');
    ticket.priority = data.priority;
  }
  if (data.assignedTo !== undefined) ticket.assignedTo = String(data.assignedTo).trim();
  if (data.resolutionNote !== undefined) ticket.resolutionNote = String(data.resolutionNote).trim();
  if (data.actualCost !== undefined) {
    const cost = Number(data.actualCost);
    if (!Number.isFinite(cost) || cost < 0) fail(400, 'Chi phí thực tế phải là số không âm.');
    ticket.actualCost = cost;
  }
  await ticket.save();
  return ticket.populate(['room', 'asset', 'reportedBy']);
}
