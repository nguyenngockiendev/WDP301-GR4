export function validateCreateRentalRequest(body) {
  if (!body?.tenant || String(body.tenant).trim().length === 0) {
    return 'Người thuê không được để trống';
  }
  if (!body?.room || String(body.room).trim().length === 0) {
    return 'Phòng không được để trống';
  }
  if (!body?.expectedDate) {
    return 'Ngày dự kiến không được để trống';
  }
  const expectedDate = new Date(body.expectedDate);
  if (expectedDate < new Date()) {
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
