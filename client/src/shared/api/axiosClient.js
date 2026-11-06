import axios from 'axios';
import { clearAuth } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    const status = error.response?.status;

    // Token hết hạn/không hợp lệ -> xóa và về login (trừ chính request đăng nhập)
    const isAuthRequest = error.config?.url?.startsWith('/auth/');
    if (status === 401 && !isAuthRequest) {
      clearAuth();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }

    return Promise.reject(error);
  },
);

export default api;
