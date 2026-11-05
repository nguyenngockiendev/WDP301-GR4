import {
  registerUser,
  loginUser,
  loginByGoogleService,
  forgotPasswordService,
  sendOtpEmailService,
} from './auth.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const register = async (req, res) => {
  try {
    const data = {
      username: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      otp: req.body.otp,
      purpose: req.body.purpose,
      repeatpassword: req.body.repeatpassword,
    };
    const result = await registerUser(data);
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
const LoginByGoogleController = async (req, res) => {
  try {
    const googleToken = req.body.googleToken;
    const result = await loginByGoogleService(googleToken);
    return sendSuccess(res, 200, 'Đăng nhập bằng Google thành công!', { user: result });
  } catch (error) {
    sendError(res, error);
  }
};

const forgotPasswordController = async (req, res) => {
  try {
    const data = {
      newPassword: req.body.newPassword,
      otp: req.body.otp,
      email: req.body.email,
      purpose: req.body.purpose,
    };

    const result = await forgotPasswordService(data);
    return sendSuccess(res, 200, 'Đặt lại mật khẩu thành công!', { user: result });
  } catch (error) {
    return sendError(res, error);
  }
};

const SenOtpController = async (req, res) => {
  try {
    const datas = { contact: req.body.contact, purpose: req.body.purpose };
    await sendOtpEmailService(datas);
    return sendSuccess(res, 200, 'Gửi OTP thành công! Vui lòng kiểm tra email của bạn.', {});
  } catch (error) {
    return sendError(res, error);
  }
};

export { register, login, LoginByGoogleController, forgotPasswordController, SenOtpController };
