import {
  registerUser,
  loginUser,
  loginByGoogleService,
  forgotPasswordService,
  sendOtpEmailService,
} from './auth.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import Users from '../../models/Users.js';
import jwt from 'jsonwebtoken';

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
    return sendSuccess(res, 200, 'Đăng nhập thành công!', { user: result });
  } catch (error) {
    return sendError(res, error);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.session?.user;
    if (!token) return sendError(res, { status: 401, message: 'Vui lòng đăng nhập để tiếp tục!' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(decoded.userId).select('-password');
    if (!user) return sendError(res, { status: 401, message: 'Phiên đăng nhập không hợp lệ!' });
    return sendSuccess(res, 200, 'Lấy thông tin tài khoản thành công!', { user });
  } catch (error) {
    return sendError(res, { status: 401, message: 'Phiên đăng nhập đã hết hạn!' });
  }
};

const logout = (req, res) => {
  req.session.destroy(error => {
    if (error) return sendError(res, error);
    res.clearCookie('haven.sid');
    return sendSuccess(res, 200, 'Đăng xuất thành công!', {});
  });
};
const LoginByGoogleController = async (req, res) => {
  try {
    const googleToken = req.body.googleToken;
    const result = await loginByGoogleService(googleToken);
    req.session.user = result;
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

export { register, login, LoginByGoogleController, forgotPasswordController, SenOtpController, getCurrentUser, logout };
