import api from '../../../shared/api/axiosClient';

const propertiesAPI = {
  getMyProperties: async () => api.get('/properties/my'),
  // Tòa nhà + phòng cho trang Home (mọi tài khoản đã đăng nhập)
  getBrowseProperties: async () => api.get('/properties/browse'),
};

export default propertiesAPI;
