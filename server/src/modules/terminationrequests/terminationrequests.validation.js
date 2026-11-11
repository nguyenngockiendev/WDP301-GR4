export function validateCreateTerminationRequest(body) {
  if (!body?.contractId || typeof body.contractId !== 'string') {
    return 'Vui lòng chọn hợp đồng/phòng muốn trả';
  }

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

  const bank = body?.refundBankAccount;
  if (!bank || typeof bank !== 'object') {
    return 'Vui lòng nhập thông tin tài khoản nhận hoàn cọc';
  }
  if (!bank.bankName || typeof bank.bankName !== 'string' || !bank.bankName.trim()) {
    return 'Tên ngân hàng không được để trống';
  }
  if (!bank.accountNumber || typeof bank.accountNumber !== 'string' || !/^[0-9]{6,25}$/.test(bank.accountNumber.trim())) {
    return 'Số tài khoản ngân hàng phải gồm 6-25 chữ số';
  }
  if (!bank.accountHolder || typeof bank.accountHolder !== 'string' || !bank.accountHolder.trim()) {
    return 'Tên chủ tài khoản không được để trống';
  }

  return null;
}
