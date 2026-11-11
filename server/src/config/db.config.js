import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDatabase() {
  try {
    const dbName = process.env.MONGODB_DB_NAME;
    await mongoose.connect(process.env.MONGODB_URI, dbName ? { dbName } : {});
    console.log('[DB] Kết nối MongoDB thành công');
  } catch (error) {
    console.error('[DB] Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
}
