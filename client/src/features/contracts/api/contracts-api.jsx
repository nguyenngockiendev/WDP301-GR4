import api from '../../../shared/api/axiosClient';

const contractsAPI = {
  getContractsByProperty: async (propertyId) => {
    return api.get(`/contracts/property/${propertyId}`);
  },

  // Phòng trống, yêu cầu thuê đã duyệt, danh sách người thuê cho form tạo hợp đồng
  getFormOptions: async (propertyId) => {
    return api.get(`/contracts/property/${propertyId}/form-options`);
  },

  getContractById: async (contractId) => {
    return api.get(`/contracts/${contractId}`);
  },

  // Văn bản hợp đồng đã điền dữ liệu vào mẫu
  getContractDocument: async (contractId) => {
    return api.get(`/contracts/${contractId}/document`);
  },

  getMySigningContracts: () => api.get('/contracts/my/signing'),
  getSigningDocument: contractId => api.get(`/contracts/${contractId}/signing`),
  changeSigning: (contractId, action, data) => api.post(`/contracts/${contractId}/signing/${action}`, data),

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

  getOccupants: async (contractId) => api.get(`/contracts/${contractId}/occupants`),
  getCoResidentCandidates: async (contractId, params = {}) => api.get(`/contracts/${contractId}/co-resident-candidates`, { params }),
  setCoResidents: async (contractId, residentIds) => api.put(`/contracts/${contractId}/co-residents`, { residentIds }),
};

export default contractsAPI;
