import api from '../../../shared/api/axiosClient';
const BASE_URL = '/termination-requests';
const terminationRequestsAPI = {
  checkEligibility: contractId => api.get(`${BASE_URL}/eligibility`, { params: { contractId } }),
  create: (payload) => api.post(BASE_URL, payload),
  getMine: () => api.get(`${BASE_URL}/my`),
  getManagerRequests: (params = {}) => api.get(`${BASE_URL}/manager`, { params }),
  getManagerRequestDetail: (id) => api.get(`${BASE_URL}/manager/${id}`),
  getCheckoutAssetInspection: (id) => api.get(`${BASE_URL}/manager/${id}/asset-inspection`),
  startCheckoutAssetInspection: (id) => api.post(`${BASE_URL}/manager/${id}/asset-inspection/start`),
  saveCheckoutAssetInspection: (id, payload) => api.put(`${BASE_URL}/manager/${id}/asset-inspection`, payload),
  getCheckoutReconciliation: (id) => api.get(`${BASE_URL}/manager/${id}/reconciliation`),
  saveCheckoutReconciliation: (id, payload) => api.put(`${BASE_URL}/manager/${id}/reconciliation`, payload),
  requestCheckoutPayment: id => api.post(`${BASE_URL}/manager/${id}/request-payment`),
  confirmCheckoutRefund: (id, proofImage) => api.post(`${BASE_URL}/manager/${id}/confirm-refund`, { proofImage }),
  finalizeCheckout: id => api.post(`${BASE_URL}/manager/${id}/finalize`),
};
export default terminationRequestsAPI;
