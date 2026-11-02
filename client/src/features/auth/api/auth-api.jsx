import api from '../../../shared/api/axiosClient';

const loginUser = async (email, password) => {
  const request = await api.post('/auth/login', { email, password });
  return request;
};

export { loginUser };
