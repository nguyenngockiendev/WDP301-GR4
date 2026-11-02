import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { UserDAO } from '../src/modules/users/users.dao.js';
import { UserService } from '../src/modules/users/users.service.js';
import { CreateUserDTO } from '../src/modules/users/users.dto.js';

if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI trong file .env.');

try {
  const dto = new CreateUserDTO(
    {
      name: 'Chủ trọ',
      email: process.env.SEED_LANDLORD_EMAIL,
      password: process.env.SEED_LANDLORD_PASSWORD,
      role: 'LANDLORD',
    },
    'LANDLORD',
  );
  await mongoose.connect(process.env.MONGODB_URI);
  await User.init();
  if (await User.exists({ email: dto.email }))
    console.log('Email đã tồn tại; không thay đổi tài khoản.');
  else {
    await new UserService(new UserDAO()).create(dto);
    console.log('Đã tạo Chủ trọ. Dùng tài khoản này để tạo Quản lý dãy trọ hoặc Người thuê.');
  }
} finally {
  await mongoose.disconnect();
}
