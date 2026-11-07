export function validateCreateTerminationRequest(body) {
  if (!body?.reason || typeof body.reason !== 'string' || !body.reason.trim()) {
    return 'Lý do trả phòng không được để trống';
  }

  if (!body?.moveOutDate || typeof body.moveOutDate !== 'string') {
    return 'Ngày dự kiến trả phòng không được để trống';
  }

  // Chỉ nhận định dạng YYYY-MM-DD từ input type=date.
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(body.moveOutDate)) {
    return 'Ngày dự kiến trả phòng không hợp lệ';
  }

  const parsedDate = new Date(`${body.moveOutDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== body.moveOutDate
  ) {
    return 'Ngày dự kiến trả phòng không hợp lệ';
  }

  // Không cho chọn ngày trong quá khứ (so sánh theo ngày tại server).
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  if (body.moveOutDate < today) {
    return 'Ngày dự kiến trả phòng không được ở trong quá khứ';
  }

  return null;
}
