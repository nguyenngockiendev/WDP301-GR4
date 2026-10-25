export function validateRegister(body) {
  if (!body?.name || String(body.name).trim().length < 2) {
    return 'Họ và tên phải có ít nhất 2 ký tự';
  }
  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
    return 'Email không hợp lệ';
  }
  if (!body?.password || String(body.password).length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  return null;
}

export function validateLogin(body) {
  if (!body?.email || !body?.password) {
    return 'Vui lòng nhập đầy đủ email và mật khẩu';
  }
  return null;
}
