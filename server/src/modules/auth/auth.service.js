import bcrypt from 'bcryptjs';
import Users from '../../models/Users.js';
import jwt from 'jsonwebtoken';

const loginUser = async data => {
  try {
    if (!data.email || !data.password) {
      throw { status: 400, message: 'Vui lòng nhập đầy đủ email và mật khẩu!' };
    }

    const user = await Users.findOne({ email: data.email });
    if (!user) {
      throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' };
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { loginUser };
