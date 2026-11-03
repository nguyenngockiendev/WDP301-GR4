import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI trong file .env.');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Kết nối MongoDB thành công');
}
