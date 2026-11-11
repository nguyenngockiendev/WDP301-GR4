export function validateCreateRentalRequest(body) {
  // Người thuê lấy từ token (req.user) trong service, không cần gửi trong body
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

export function validateCreateGuestRentalRequest(body) {
  if (!body?.room || String(body.room).trim().length === 0) return 'Phòng không được để trống';
  if (String(body.fullName || '').trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || '').trim())) return 'Email không hợp lệ';
  if (!/^[0-9+().\-\s]{8,20}$/.test(String(body.phone || '').trim())) return 'Số điện thoại không hợp lệ';
  if (!body.expectedDate) return 'Ngày dự kiến không được để trống';
  const expectedDate = new Date(body.expectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(expectedDate.getTime()) || expectedDate < new Date(today.getTime() - 86400000)) {
    return 'Ngày dự kiến không được trong quá khứ';
  }
  if (String(body.note || '').length > 500) return 'Ghi chú tối đa 500 ký tự';
  return null;
}

export function validateCreateTenantAccount(body) {
  const password = String(body?.password || '');
  if (password.length < 8 || password.length > 100) return 'Mật khẩu phải dài từ 8 đến 100 ký tự';
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
