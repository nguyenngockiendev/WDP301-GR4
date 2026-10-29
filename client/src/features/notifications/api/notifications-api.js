import api from '../../../shared/api/axiosClient';

export const notificationsAPI = {
  list: params => api.get('/notifications', { params }),
  unread: () => api.get('/notifications/unread-count'),
  read: id => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};
