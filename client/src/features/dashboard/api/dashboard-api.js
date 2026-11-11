import api from '../../../shared/api/axiosClient';
export const getDashboard = async (filters, signal) => {
  const response = await api.get('/dashboard', { params: filters, signal });
  return response.data;
};
