import { loginUser } from './auth.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

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

export { login };
