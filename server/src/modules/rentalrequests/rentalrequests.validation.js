export function validateCreateRentalRequest(body) {
  if (!body?.room || String(body.room).trim().length === 0) {
    return 'Phòng không được để trống';
  }
  if (!body?.expectedDate) {
    return 'Ngày dự kiến không được để trống';
  }
  const expectedDate = new Date(body.expectedDate);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  // So theo ngày (cho phép chọn hôm nay); 'YYYY-MM-DD' được parse theo UTC nên lùi thêm 1 ngày để tránh lệch múi giờ
  if (Number.isNaN(expectedDate.getTime()) || expectedDate < new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)) {
    return 'Ngày dự kiến không được trong quá khứ';
  }
  return null;
}

export function validateProcessRentalRequest(body) {
  if (!body?.status || !['approved', 'rejected'].includes(body.status)) {
    return 'Trạng thái không hợp lệ';
  }
  if (body.status === 'rejected' && !body?.rejectReason) {
    return 'Lý do từ chối không được để trống';
  }
  return null;
}
