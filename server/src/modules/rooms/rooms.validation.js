export function validateCreateRoom(body) {
  if (!body?.roomNumber || String(body.roomNumber).trim().length === 0) {
    return 'Số phòng không được để trống';
  }
  if (!body?.area || Number(body.area) <= 0) {
    return 'Diện tích phòng phải lớn hơn 0';
  }
  if (body?.price === undefined || body?.price === '' || !Number.isFinite(Number(body.price)) || Number(body.price) < 0) {
    return 'Giá thuê phải là số không âm';
  }
  if (body.tier && !['basic', 'standard', 'premium'].includes(body.tier)) return 'Hạng phòng không hợp lệ';
  if (body.maxTenants && Number(body.maxTenants) <= 0) {
    return 'Số người tối đa phải lớn hơn 0';
  }
  return null;
}

export function validateUpdateRoom(body) {
  if (body?.roomNumber && String(body.roomNumber).trim().length === 0) {
    return 'Số phòng không được để trống';
  }
  if (body?.area && Number(body.area) <= 0) {
    return 'Diện tích phòng phải lớn hơn 0';
  }
  if (body?.price !== undefined && Number(body.price) < 0) {
    return 'Giá thuê không được âm';
  }
  if (body?.tier !== undefined && !['basic', 'standard', 'premium'].includes(body.tier)) return 'Hạng phòng không hợp lệ';
  if (body?.maxTenants && Number(body.maxTenants) <= 0) {
    return 'Số người tối đa phải lớn hơn 0';
  }
  return null;
}

export function validateUpdateRoomStatus(body) {
  const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
  if (!body?.status || !validStatuses.includes(body.status)) {
    return 'Trạng thái phòng không hợp lệ';
  }
  return null;
}
