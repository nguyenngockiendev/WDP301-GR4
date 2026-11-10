import api from '../../../shared/api/axiosClient';

const reconciliationAPI = {
  getReconciliation: async (filters, signal) => {
    return api.get('/reconciliation', { params: filters, signal });
  },
};

export default reconciliationAPI;
