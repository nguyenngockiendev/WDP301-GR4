import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    const status = error.response?.status;

    if (status === 401) {
      const sent = error.config?.headers?.Authorization;
      if (sent === 'Bearer ' + localStorage.getItem('token')) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-changed'));
      }
    }

    return Promise.reject(error);
  },
);

export default api;
