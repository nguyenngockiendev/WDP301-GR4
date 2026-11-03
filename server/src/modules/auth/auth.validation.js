export function validateRegister(body) {
  if (!body?.username || String(body.username).trim().length < 2) {
    return 'Username phải có ít nhất 2 ký tự';
  }
  if (!body?.fullName || String(body.fullName).trim().length < 2) {
    return 'Họ và tên phải có ít nhất 2 ký tự';
  }
  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
    return 'Email không hợp lệ';
  }
  if (!body?.password || String(body.password).length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự';
  }
  return null;
}

export function validateLogin(body) {
  if (!(body?.email || body?.identifier) || !body?.password) {
    return 'Vui lòng nhập username/email và mật khẩu';
  }
  return null;
}
