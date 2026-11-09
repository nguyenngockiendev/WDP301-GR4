import mongoose from 'mongoose';
import Assets from '../../models/Assets.js';
import MaintenanceTickets from '../../models/MaintenanceTickets.js';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Contracts from '../../models/Contracts.js';

const assetStatuses = ['in_stock', 'in_use', 'maintenance', 'retired'];
const priorities = ['low', 'normal', 'high', 'urgent'];
const ticketStatuses = ['reported', 'approved', 'in_progress', 'completed', 'rejected'];

function fail(status, message) {
  throw { status, message };
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getProperty(user, propertyId) {
  if (!isValidId(propertyId)) fail(400, 'Mã nhà trọ không hợp lệ.');

  let property;
  if (user.role === 'landlord') {
    property = await Properties.findOne({ _id: propertyId, owner: user.userId });
  } else if (user.role === 'manager') {
    const assignment = await ManagerAssignments.exists({
      manager: user.userId,
      property: propertyId,
      status: 'active',
    });
    if (assignment) property = await Properties.findById(propertyId);
  }

  if (!property) fail(404, 'Không tìm thấy nhà trọ hoặc bạn không có quyền quản lý.');
  return property;
}

async function getRoom(propertyId, roomId) {
  if (!isValidId(roomId)) fail(400, 'Mã phòng không hợp lệ.');

  const room = await Rooms.findOne({ _id: roomId, property: propertyId });
  if (!room) fail(404, 'Phòng không thuộc nhà trọ này.');
  return room;
}

export async function listAssets(user, propertyId) {
  await getProperty(user, propertyId);
  return Assets.find({ property: propertyId })
    .populate('room', 'roomNumber')
    .sort({ status: 1, name: 1 });
}

export async function listRooms(user, propertyId) {
  await getProperty(user, propertyId);
  return Rooms.find({ property: propertyId })
    .select('roomNumber area tier status')
    .sort({ roomNumber: 1 });
}

export async function listCheckoutInspections(user, propertyId) {
  await getProperty(user, propertyId);
  const roomIds = await Rooms.find({ property: propertyId }).distinct('_id');
  return Contracts.find({ room: { $in: roomIds } })
    .populate({ path: 'room', select: 'roomNumber' })
    .populate({ path: 'representative', select: 'fullName' })
    .populate({ path: 'checkoutInspection.checkedBy', select: 'fullName' })
    .sort({ updatedAt: -1 });
}

export async function saveCheckoutInspection(user, propertyId, contractId, data) {
  await getProperty(user, propertyId);
  if (!isValidId(contractId)) fail(400, 'Mã hợp đồng không hợp lệ.');
  const contract = await Contracts.findById(contractId);
  if (!contract) fail(404, 'Không tìm thấy hợp đồng.');
  await getRoom(propertyId, contract.room);
  if (!Array.isArray(data.assets)) fail(400, 'Danh sách tài sản kiểm tra không hợp lệ.');

  const roomAssets = await Assets.find({ property: propertyId, room: contract.room });
  const byId = new Map(roomAssets.map(asset => [String(asset._id), asset]));
  const unique = new Set();
  const checkedAssets = data.assets.map(item => {
    const asset = byId.get(String(item.asset));
    if (!asset || unique.has(String(asset._id))) fail(400, 'Có thiết bị không thuộc phòng này.');
    unique.add(String(asset._id));
    const damaged = Boolean(item.damaged);
    const compensationAmount = item.compensationAmount === '' || item.compensationAmount === undefined
      ? 0
      : Number(item.compensationAmount);
    if (!Number.isFinite(compensationAmount) || compensationAmount < 0 || (!damaged && compensationAmount > 0)) {
      fail(400, 'Tiền bồi thường phải hợp lệ và chỉ áp dụng cho thiết bị bị hỏng.');
    }
    return {
      asset: asset._id,
      assetCode: asset.assetCode,
      name: asset.name,
      damaged,
      compensationAmount,
      note: String(item.note || '').trim(),
    };
  });

  contract.checkoutInspection = {
    checkedAt: new Date(),
    checkedBy: user.userId,
    note: String(data.note || '').trim(),
    assets: checkedAssets,
  };
  await contract.save();
  return Contracts.findById(contract._id)
    .populate({ path: 'room', select: 'roomNumber' })
    .populate({ path: 'representative', select: 'fullName' })
    .populate({ path: 'checkoutInspection.checkedBy', select: 'fullName' });
}

export async function createAsset(user, propertyId, data) {
  await getProperty(user, propertyId);

  const name = String(data.name || '').trim();
  const category = String(data.category || '').trim();
  const purchasePrice =
    data.purchasePrice === '' || data.purchasePrice === undefined ? 0 : Number(data.purchasePrice);
  const status = data.status || (data.room ? 'in_use' : 'in_stock');

  if (name.length < 2 || category.length < 2) {
    fail(400, 'Tên và nhóm thiết bị cần có ít nhất 2 ký tự.');
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    fail(400, 'Giá mua phải là số không âm.');
  }
  if (!assetStatuses.includes(status)) fail(400, 'Trạng thái thiết bị không hợp lệ.');

  const room = data.room ? await getRoom(propertyId, data.room) : null;
  if (status === 'in_use' && !room) {
    fail(400, 'Thiết bị đang sử dụng cần được gán cho một phòng.');
  }

  const asset = await Assets.create({
    property: propertyId,
    room: room?._id || null,
    name,
    category,
    brand: String(data.brand || '').trim(),
    model: String(data.model || '').trim(),
    assetCode: String(data.assetCode || '').trim(),
    purchaseDate: data.purchaseDate || null,
    warrantyExpiryDate: data.warrantyExpiryDate || null,
    purchasePrice,
    status,
    note: String(data.note || '').trim(),
    createdBy: user.userId,
  });

  return asset.populate('room', 'roomNumber');
}

export async function updateAsset(user, propertyId, assetId, data) {
  await getProperty(user, propertyId);
  if (!isValidId(assetId)) fail(400, 'Mã thiết bị không hợp lệ.');

  const asset = await Assets.findOne({ _id: assetId, property: propertyId });
  if (!asset) fail(404, 'Không tìm thấy thiết bị.');

  const fields = [
    'name',
    'category',
    'brand',
    'model',
    'assetCode',
    'purchaseDate',
    'warrantyExpiryDate',
    'purchasePrice',
    'status',
    'note',
  ];
  for (const field of fields) {
    if (Object.hasOwn(data, field)) asset[field] = data[field];
  }

  if (Object.hasOwn(data, 'room')) {
    asset.room = data.room ? (await getRoom(propertyId, data.room))._id : null;
  }

  if (String(asset.name).trim().length < 2 || String(asset.category).trim().length < 2) {
    fail(400, 'Tên và nhóm thiết bị cần có ít nhất 2 ký tự.');
  }
  if (asset.status === 'in_use' && !asset.room) {
    fail(400, 'Thiết bị đang sử dụng cần được gán cho một phòng.');
  }
  if (!assetStatuses.includes(asset.status)) fail(400, 'Trạng thái thiết bị không hợp lệ.');
  if (!Number.isFinite(Number(asset.purchasePrice)) || Number(asset.purchasePrice) < 0) {
    fail(400, 'Giá mua phải là số không âm.');
  }

  const openTicket = await MaintenanceTickets.exists({
    asset: asset._id,
    status: { $in: ['reported', 'approved', 'in_progress'] },
  });
  if (openTicket && asset.status !== 'maintenance') {
    fail(409, 'Thiết bị có yêu cầu bảo trì chưa hoàn tất.');
  }

  await asset.save();
  return asset.populate('room', 'roomNumber');
}

export async function listMaintenance(user, propertyId, status) {
  await getProperty(user, propertyId);
  if (status && status !== 'all' && !ticketStatuses.includes(status)) {
    fail(400, 'Trạng thái yêu cầu bảo trì không hợp lệ.');
  }

  const query = { property: propertyId };
  if (status && status !== 'all') query.status = status;

  return MaintenanceTickets.find(query)
    .populate('room', 'roomNumber')
    .populate('asset', 'name assetCode status')
    .populate('reportedBy', 'fullName phone')
    .sort({ createdAt: -1 });
}

export async function createMaintenance(user, propertyId, data) {
  await getProperty(user, propertyId);
  const room = await getRoom(propertyId, data.room);
  const title = String(data.title || '').trim();
  const category = String(data.category || '').trim();
  const description = String(data.description || '').trim();
  const estimatedCost =
    data.estimatedCost === '' || data.estimatedCost === undefined ? 0 : Number(data.estimatedCost);
  const priority = data.priority || 'normal';

  if (title.length < 3 || category.length < 2 || description.length < 5) {
    fail(400, 'Vui lòng nhập tiêu đề, nhóm và mô tả sự cố đầy đủ.');
  }
  if (!Number.isFinite(estimatedCost) || estimatedCost < 0) {
    fail(400, 'Chi phí dự kiến phải là số không âm.');
  }
  if (!priorities.includes(priority)) fail(400, 'Mức độ ưu tiên không hợp lệ.');

  let asset = null;
  if (data.asset) {
    if (!isValidId(data.asset)) fail(400, 'Mã thiết bị không hợp lệ.');
    asset = await Assets.findOne({ _id: data.asset, property: propertyId });
    if (!asset || (asset.room && String(asset.room) !== String(room._id))) {
      fail(400, 'Thiết bị không thuộc phòng được chọn.');
    }
    if (['maintenance', 'retired'].includes(asset.status)) {
      fail(409, 'Không thể tạo yêu cầu cho thiết bị đang bảo trì hoặc đã thanh lý.');
    }
  }

  const ticket = await MaintenanceTickets.create({
    property: propertyId,
    room: room._id,
    asset: asset?._id || null,
    title,
    category,
    description,
    priority,
    estimatedCost,
    reportedBy: user.userId,
    assignedTo: String(data.assignedTo || '').trim(),
  });

  if (asset) {
    asset.status = 'maintenance';
    await asset.save();
  }

  return ticket.populate(['room', 'asset', 'reportedBy']);
}

export async function updateMaintenance(user, propertyId, ticketId, data) {
  await getProperty(user, propertyId);
  if (!isValidId(ticketId)) fail(400, 'Mã yêu cầu bảo trì không hợp lệ.');

  const ticket = await MaintenanceTickets.findOne({ _id: ticketId, property: propertyId }).populate(
    'asset'
  );
  if (!ticket) fail(404, 'Không tìm thấy yêu cầu bảo trì.');

  const transitions = {
    reported: ['approved', 'rejected'],
    approved: ['in_progress', 'rejected'],
    in_progress: ['completed'],
    completed: [],
    rejected: [],
  };

  if (data.status && data.status !== ticket.status) {
    if (!transitions[ticket.status].includes(data.status)) {
      fail(409, 'Trạng thái yêu cầu không thể chuyển theo bước này.');
    }
    ticket.status = data.status;
    if (data.status === 'completed') ticket.completedAt = new Date();
    if (['completed', 'rejected'].includes(data.status) && ticket.asset?.status === 'maintenance') {
      ticket.asset.status = ticket.asset.room ? 'in_use' : 'in_stock';
      await ticket.asset.save();
    }
  }

  if (data.priority !== undefined) {
    if (!priorities.includes(data.priority)) fail(400, 'Mức độ ưu tiên không hợp lệ.');
    ticket.priority = data.priority;
  }
  if (data.assignedTo !== undefined) ticket.assignedTo = String(data.assignedTo).trim();
  if (data.resolutionNote !== undefined) ticket.resolutionNote = String(data.resolutionNote).trim();
  if (data.actualCost !== undefined) {
    const actualCost = Number(data.actualCost);
    if (!Number.isFinite(actualCost) || actualCost < 0) {
      fail(400, 'Chi phí thực tế phải là số không âm.');
    }
    ticket.actualCost = actualCost;
  }

  await ticket.save();
  return ticket.populate(['room', 'asset', 'reportedBy']);
}
