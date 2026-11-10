import api from '../../../shared/api/axiosClient';

export const notificationsAPI = {
  list: async params => {
    return api.get('/notifications', { params });
  },

  unread: async () => {
    return api.get('/notifications/unread-count');
  },

  read: async id => {
    return api.patch(`/notifications/${id}/read`);
  },

  readAll: async () => {
    return api.patch('/notifications/read-all');
  },
};
