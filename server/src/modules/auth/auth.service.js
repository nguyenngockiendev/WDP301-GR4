import bcrypt from 'bcryptjs';
import Users from '../../models/Users.js';
import jwt from 'jsonwebtoken';

const registerUser = async data => {
  try {
    if (!data.username || !data.email || !data.password || !data.fullName) {
      throw { status: 400, message: 'Vui lòng điền đầy đủ thông tin!' };
    }

    const existingUser = await Users.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });
    if (existingUser) {
      throw { status: 400, message: 'Email hoặc username đã tồn tại!' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await Users.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      phone: data.phone || '',
      role: data.role || 'tenant',
      status: 'active',
    });

    return {
      userId: newUser._id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const loginUser = async data => {
  try {
    if (!data.email || !data.password) {
      throw { status: 400, message: 'Vui lòng nhập đầy đủ email và mật khẩu!' };
    }

    const user = await Users.findOne({ email: data.email });
    if (!user) {
      throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' };
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

export { registerUser, loginUser };
