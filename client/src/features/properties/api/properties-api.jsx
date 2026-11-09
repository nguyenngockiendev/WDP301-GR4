import api from '../../../shared/api/axiosClient';

const propertiesAPI = {
  getMyProperties: async () => api.get('/properties/my'),
  getBrowseProperties: async () => api.get('/properties/browse'),
};

export default propertiesAPI;
