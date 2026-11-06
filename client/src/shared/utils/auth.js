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
