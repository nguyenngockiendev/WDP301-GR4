import api from '../../../shared/api/axiosClient';
const BASE_URL = '/termination-requests';
const terminationRequestsAPI = {
  checkEligibility: () => api.get(`${BASE_URL}/eligibility`),
  create: (payload) => api.post(BASE_URL, payload),
  getMine: () => api.get(`${BASE_URL}/my`),
  getManagerRequests: (params = {}) => api.get(`${BASE_URL}/manager`, { params }),
  getManagerRequestDetail: (id) => api.get(`${BASE_URL}/manager/${id}`),
};
export default terminationRequestsAPI;
