import { registerUser, loginUser } from './auth.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, 201, 'Đăng ký tài khoản thành công!', { user: result });
  } catch (error) {
    return sendError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const data = {
      email: req.body.email,
      password: req.body.password,
    };
    const result = await loginUser(data);
    req.session.user = result;
    return sendSuccess(res, 200, 'Đăng nhập thành công!', { user: result });
  } catch (error) {
    return sendError(res, error);
  }
};

export { register, login };
