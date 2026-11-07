import api from '../../../shared/api/axiosClient';

const BASE_URL = '/termination-requests';

const terminationRequestsAPI = {
  checkEligibility: () => api.get(`${BASE_URL}/eligibility`),
  create: (payload) => api.post(BASE_URL, payload),
  getMine: () => api.get(`${BASE_URL}/my`),
};

export default terminationRequestsAPI;
