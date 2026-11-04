import api from '../../../shared/api/axiosClient';

const loginUserAPI = async (email, password) => {
  const request = await api.post('/auth/login', { email, password });
  return request;
};
const loginByGoogleAPI = async googleToken => {
  const request = await api.post('/auth/login/google', { googleToken });
  return request;
};
const forgotPasswordAPI = async data => {
  const request = await api.post('/auth/forgot-password', data);
  return request;
};
const sendOtpAPI = async data => {
  const request = await api.post('/auth/send-otp', data);
  return request;
};
const registerUserAPI = async data => {
  const request = await api.post('/auth/register', data);
  return request;
};
export { loginUserAPI, loginByGoogleAPI, forgotPasswordAPI, sendOtpAPI, registerUserAPI };
