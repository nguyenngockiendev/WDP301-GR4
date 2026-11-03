import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Kết nối MongoDB thành công');
  } catch (error) {
    console.error('[DB] Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
}
