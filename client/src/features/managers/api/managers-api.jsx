import api from '../../../shared/api/axiosClient';

const managersAPI = {
  getAssignments: async (params) => api.get('/manager-assignments', { params }),

  getAvailableManagers: async (q) => api.get('/manager-assignments/available-managers', { params: { q } }),

  assignManager: async (data) => api.post('/manager-assignments', data),

  removeAssignment: async (assignmentId) => api.patch(`/manager-assignments/${assignmentId}/remove`),
};

export default managersAPI;
