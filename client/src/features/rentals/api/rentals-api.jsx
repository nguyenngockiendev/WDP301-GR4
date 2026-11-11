import api from '../../../shared/api/axiosClient';

const rentalsAPI = {
  getRentalRequestsByProperty: async (propertyId) => {
    return api.get(`/rental-requests/property/${propertyId}`);
  },

  getRentalRequestById: async (requestId) => {
    return api.get(`/rental-requests/${requestId}`);
  },

  createRentalRequest: async (requestData) => {
    return api.post('/rental-requests', requestData);
  },

  createGuestRentalRequest: async (requestData) => {
    return api.post('/rental-requests/guest', requestData);
  },

  createTenantAccountForRequest: async (requestId, data) => {
    return api.post(`/rental-requests/${requestId}/create-tenant-account`, data);
  },

  processRentalRequest: async (requestId, data) => {
    return api.patch(`/rental-requests/${requestId}/process`, data);
  },

  getPendingRequests: async (propertyId) => {
    return api.get(`/rental-requests/pending/${propertyId}`);
  },
};

export default rentalsAPI;
