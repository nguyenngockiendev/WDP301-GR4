import { jwtDecode } from 'jwt-decode';

export const getToken = () => localStorage.getItem('token');

export const saveToken = token => {
  localStorage.setItem('token', token);
  const user = decodeToken(token);
  if (user?.userId) localStorage.setItem('userId', user.userId);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('currentPropertyId');
};

export const decodeToken = token => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  const user = decodeToken(token);
  if (!user || (user.exp && user.exp * 1000 < Date.now())) {
    clearAuth();
    return null;
  }
  return user;
};

/** Trang mặc định sau khi đăng nhập: người thuê về trang Home, chủ trọ / quản lý vào trang quản lý. */
export const getDefaultPathForRole = role => (role === 'tenant' ? '/home' : '/dashboard');

/**
 * Trang cần quay lại sau khi đăng nhập: trang người dùng đang xem trước khi bị bắt đăng nhập
 * (state.from), nếu không có thì về trang mặc định theo vai trò.
 */
export const getPostLoginPath = (from, role) => {
  const path = from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '';
  if (!path || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password')) {
    return getDefaultPathForRole(role);
  }
  // Người thuê không vào trang quản lý
  if (role === 'tenant' && path.startsWith('/dashboard')) return '/home';
  return path;
};
