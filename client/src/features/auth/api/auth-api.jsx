import api from '../../../shared/api/axiosClient';

const loginUser = async (identifier, password) => {
  const request = await api.post('/auth/login', { identifier, password });
  return request;
};

export { loginUser };
