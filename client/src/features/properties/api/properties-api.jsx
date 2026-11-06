import api from '../../../shared/api/axiosClient';

const propertiesAPI = {
  getMyProperties: async () => api.get('/properties/my'),
};

export default propertiesAPI;
