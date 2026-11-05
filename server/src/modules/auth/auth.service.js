import bcrypt from 'bcryptjs';
import Users from '../../models/Users.js';
import Otp from '../../models/Otps.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import emailTemplates from '../../shared/utils/email.templates.js';
import { ServiceEmail } from '../../shared/utils/email.js';
const loginUser = async data => {
  try {
    if (!data.email || !data.password) {
      throw { status: 400, message: 'Vui lòng nhập đầy đủ email và mật khẩu!' };
    }

    const user = await Users.findOne({ email: data.email });

    if (!user) {
      throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' };
    }
    if (user.status === 'inactive') {
      throw { status: 401, message: 'Tài khoản của bạn bị khóa!' };
    }
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' };
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    return token;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
const loginByGoogleService = async googleToken => {
  if (!googleToken) {
    throw { status: 400, message: 'Thiếu Google Token!' };
  }
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  if (!client) {
    throw { status: 404, message: 'Mã hết hạn hoặc không tồn tại!' };
  }
  const ticket = await client.verifyIdToken({
    idToken: googleToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { sub: googleId, email, name } = ticket.getPayload();
  const isAccount = await Users.findOne({
    $or: [{ googleId: googleId }, { email: email }],
  });
  if (isAccount && isAccount.status === 'inactive') {
    throw { status: 403, message: 'Tài khoản bị khóa!' };
  }
  if (isAccount) {
    if (isAccount.googleId != googleId) {
      isAccount.googleId = googleId;
      isAccount.isVerified = true;
      await isAccount.save();
    }
  }

  if (!isAccount) {
    const result = await Users.create({
      username: name,
      email: email,
      fullName: name,
      password: null,
      phone: '',
      isVerified: true,
      googleId: googleId,
    });
    const payload = { userId: result._id, role: result.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
  }
  const payload = { userId: isAccount._id, role: isAccount.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const registerUser = async data => {
  try {
    for (const item in data) {
      if (!data[item] || data[item] === '') {
        throw {
          status: 404,
          message: 'Thông tin không chính xác , không đc để trống!',
        };
      }
    }
    const exitUser = await Users.findOne({ email: data.email });
    if (exitUser) {
      throw {
        status: 400,
        message: 'Email đã tồn tại!',
      };
    }

    if (data.otp.length < 6) {
      throw {
        status: 400,
        message: 'OTP sai!',
      };
    }
    const isOtp = await Otp.findOne({
      contact: data.email,
      otpCode: data.otp,
      purpose: data.purpose,
    });
    if (!isOtp) {
      throw {
        status: 400,
        message: 'Mã OTP không chính xác hoặc đã hết hạn!',
      };
    }

    if (data.password.length < 6) {
      throw {
        status: 400,
        message: 'Mật khẩu phải >= 6 kí tự',
      };
    }
    if (data.password !== data.repeatpassword) {
      throw { status: 400, message: 'Mật khẩu xác nhận không khớp!' };
    }
    if (exitUser) {
      throw { status: 400, message: 'Email đã tồn tại' };
    }

    const hashpassword = await bcrypt.hash(data.password, parseInt(process.env.SALT_ROUNDS));

    const result = await Users.create({
      username: data.username,
      email: data.email,
      password: hashpassword,
      fullName: data.username,
      role: 'tenant',
      status: 'active',
      phone: '',
      isVerified: true,
    });
    await Otp.deleteMany({ contact: data.email, purpose: 'register' });

    return result;
  } catch (error) {
    throw error;
  }
};
const forgotPasswordService = async data => {
  try {
    for (const item in data) {
      if (!data[item] || data[item] === '') {
        throw {
          status: 404,
          message: 'Thông tin không chính xác , không đc để trống!',
        };
      }
    }
    if (data.newPassword.length < 6) {
      throw {
        status: 400,
        message: 'Dữ liệu không hợp lệ hoặc thiếu thông tin!',
      };
    }
    if (data.otp.length < 6) {
      throw {
        status: 400,
        message: 'OTP sai!',
      };
    }
    const isOtp = await Otp.findOne({
      contact: data.email,
      otpCode: data.otp,
      purpose: data.purpose,
    });
    if (!isOtp) {
      throw {
        status: 400,
        message: 'Mã OTP không chính xác hoặc đã hết hạn!',
      };
    }
    const isUser = await Users.findOne({
      email: data.email,
    });
    if (!isUser) {
      throw {
        status: 404,
        message: 'Tài khoản không tồn tại!',
      };
    }
    if (isUser.status === 'inactive') {
      throw {
        status: 403,
        message: 'Tài khoản của bạn đang bị khóa, không thể đổi mật khẩu!',
      };
    }

    const newPass = await bcrypt.hash(data.newPassword, parseInt(process.env.SALT_ROUNDS));
    const result = await Users.findOneAndUpdate(
      {
        email: data.email,
      },
      {
        isVerified: true,
        password: newPass,
      },
    );
    await Otp.deleteMany({
      contact: data.email,
      purpose: data.purpose,
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const sendOtpEmailService = async datas => {
  try {
    const antiSpam = await Otp.findOne({
      contact: datas.contact,
      purpose: datas.purpose,
    });
    if (antiSpam && Date.now() - new Date(antiSpam.createdAt).getTime() < 60000) {
      throw {
        status: 429,
        message: 'Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã!',
      };
    }
    await Otp.deleteMany({
      contact: datas.contact,
      purpose: datas.purpose,
    });
    let otpCode = Math.floor(Math.random() * 900000 + 100000);
    await Otp.create({
      contact: datas.contact,
      otpCode: otpCode,
      purpose: datas.purpose,
    });
    const type = emailTemplates[datas.purpose];
    if (!type) {
      throw { status: 400, message: 'Mục đích gửi email không hợp lệ!' };
    }
    if (datas.purpose === 'register') {
      const exitUser = await Users.findOne({ email: datas.contact });
      if (exitUser) {
        throw {
          status: 400,
          message: 'Email đã tồn tại!',
        };
      }
    }
    const { subject, html } = type({ otp: otpCode });

    const data = {
      email: datas.contact,
      subject: subject,
      html: html,
    };
    const result = await ServiceEmail(data);
    return result;
  } catch (error) {
    throw error;
  }
};

export {
  registerUser,
  loginUser,
  loginByGoogleService,
  forgotPasswordService,
  sendOtpEmailService,
};
