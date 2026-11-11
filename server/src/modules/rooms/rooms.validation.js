export function validateCreateRoom(body) {
  if (!body?.roomNumber || String(body.roomNumber).trim().length === 0) {
    return 'Số phòng không được để trống';
  }
  const area = Number(body?.area);
  if (!Number.isFinite(area) || area <= 0) {
    return 'Diện tích phòng phải lớn hơn 0';
  }
  const price = Number(body?.price);
  if (body?.price === undefined || body.price === '' || !Number.isFinite(price) || price <= 0 || price > 10000000) {
    return 'Giá thuê phải từ 1 đến 10.000.000 đồng/tháng';
  }
  if (body.floor !== undefined && (!Number.isInteger(Number(body.floor)) || Number(body.floor) < 1 || Number(body.floor) > 5))
    return 'Tầng của phòng phải từ 1 đến 5';
  if (body.tier && !['basic', 'standard', 'premium'].includes(body.tier))
    return 'Hạng phòng không hợp lệ';
  if (body.maxTenants !== undefined && body.maxTenants !== '') {
    const maxTenants = Number(body.maxTenants);
    if (!Number.isInteger(maxTenants) || maxTenants < 1 || maxTenants > 4)
      return 'Số người tối đa phải từ 1 đến 4';
  }
  return null;
}

export function validateUpdateRoom(body) {
  if (body?.roomNumber !== undefined && String(body.roomNumber).trim().length === 0) {
    return 'Số phòng không được để trống';
  }
  if (body?.area !== undefined) {
    const area = Number(body.area);
    if (!Number.isFinite(area) || area <= 0) return 'Diện tích phòng phải lớn hơn 0';
  }
  if (body?.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0 || price > 10000000) return 'Giá thuê phải từ 1 đến 10.000.000 đồng/tháng';
  }
  if (body.floor !== undefined && (!Number.isInteger(Number(body.floor)) || Number(body.floor) < 1 || Number(body.floor) > 5))
    return 'Tầng của phòng phải từ 1 đến 5';
  if (body?.tier !== undefined && !['basic', 'standard', 'premium'].includes(body.tier))
    return 'Hạng phòng không hợp lệ';
  if (body?.maxTenants !== undefined) {
    const maxTenants = Number(body.maxTenants);
    if (!Number.isInteger(maxTenants) || maxTenants < 1 || maxTenants > 4)
      return 'Số người tối đa phải từ 1 đến 4';
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
