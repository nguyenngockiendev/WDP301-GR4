import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/entities/User.js';
import { UserDAO } from '../src/dao/UserDAO.js';
import { UserService } from '../src/services/UserService.js';
import { CreateUserDTO } from '../src/dto/UserDTO.js';
try {
  const dto = new CreateUserDTO({ name: 'Chủ trọ', email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, role: 'ADMIN' }, true);
  await mongoose.connect(process.env.MONGODB_URI);
  await User.init();
  if (await User.exists({ email: dto.email })) console.log('Email đã tồn tại; không thay đổi tài khoản.');
  else { await new UserService(new UserDAO()).create(dto); console.log('Đã tạo Chủ trọ. Dùng tài khoản này để tạo Quản lý dãy trọ hoặc Người thuê.'); }
} finally { await mongoose.disconnect(); }
