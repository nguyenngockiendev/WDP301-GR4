import api from '../../../shared/api/axiosClient';

const reconciliationAPI = {
  syncPayment: async paymentId => {
    return api.post(`/reconciliation/payments/${paymentId}/sync`);
  },
  getReconciliation: async (filters, signal) => {
    return api.get('/reconciliation', { params: filters, signal });
  },
};

export default reconciliationAPI;
