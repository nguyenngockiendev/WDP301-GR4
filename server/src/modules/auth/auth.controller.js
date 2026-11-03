import {
  registerUser,
  loginUser,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  updateProfile,
  changePassword,
} from './auth.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, 201, result.emailSent ? 'Đăng ký thành công. Hãy kiểm tra email để lấy mã OTP.' : 'Tài khoản đã tạo nhưng email OTP chưa gửi được. Kiểm tra cấu hình SMTP rồi chọn gửi lại mã.', result);
  } catch (error) {
    return sendError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    req.session.regenerate(error => {
      if (error) return sendError(res, { status: 500, message: 'Không thể tạo phiên đăng nhập.' });
      req.session.user = result;
      req.session.save(saveError => {
        if (saveError) return sendError(res, saveError);
        return sendSuccess(res, 200, 'Đăng nhập thành công!', { user: result });
      });
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const user = await verifyRegistrationOtp(req.body);
    return sendSuccess(res, 200, 'Xác thực tài khoản thành công.', { user });
  } catch (error) { return sendError(res, error); }
};

const resendOtp = async (req, res) => {
  try {
    await resendRegistrationOtp(req.body.email);
    return sendSuccess(res, 200, 'Đã gửi mã xác thực mới.');
  } catch (error) { return sendError(res, error); }
};

const me = (req, res) => sendSuccess(res, 200, 'Thông tin phiên đăng nhập.', { user: req.user });

const logout = (req, res) => {
  req.session.destroy(error => {
    if (error) return sendError(res, error);
    res.clearCookie('haven.sid');
    return sendSuccess(res, 200, 'Đã đăng xuất.');
  });
};

const profile = async (req, res) => {
  try {
    const user = await updateProfile(req.user.userId, req.body);
    req.session.user = user;
    return sendSuccess(res, 200, 'Đã cập nhật hồ sơ.', { user });
  } catch (error) { return sendError(res, error); }
};

const password = async (req, res) => {
  try {
    await changePassword(req.user.userId, req.body);
    return sendSuccess(res, 200, 'Đã đổi mật khẩu.');
  } catch (error) { return sendError(res, error); }
};

export { register, login, verifyOtp, resendOtp, me, logout, profile, password };
