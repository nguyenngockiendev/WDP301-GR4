import api from '../../../shared/api/axiosClient';

const reportsAPI = {
  getReports: async (filters, signal) => {
    return api.get('/reports', { params: filters, signal });
  },
};

export default reportsAPI;
