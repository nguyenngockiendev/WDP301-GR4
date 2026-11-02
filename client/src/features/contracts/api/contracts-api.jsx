import api from '../../../shared/api/axiosClient';

const contractsAPI = {
  getContractsByProperty: async (propertyId) => {
    return api.get(`/contracts/property/${propertyId}`);
  },

  getContractById: async (contractId) => {
    return api.get(`/contracts/${contractId}`);
  },

  createContract: async (contractData) => {
    return api.post('/contracts', contractData);
  },

  updateContract: async (contractId, contractData) => {
    return api.put(`/contracts/${contractId}`, contractData);
  },

  renewContract: async (contractId, newEndDate) => {
    return api.patch(`/contracts/${contractId}/renew`, { newEndDate });
  },

  changeRepresentative: async (contractId, newRepresentative) => {
    return api.patch(`/contracts/${contractId}/change-representative`, { newRepresentative });
  },

  searchContracts: async (filters) => {
    return api.get('/contracts/search', { params: filters });
  },
};

export default contractsAPI;
