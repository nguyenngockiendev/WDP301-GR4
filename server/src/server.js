import app from './app/app.js';
import { connectDatabase } from './config/db.config.js';
import dotenv from 'dotenv';
const PORT = process.env.PORT || 9999;
dotenv.config();

async function bootstrap() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`[Server] Đang chạy tại :${PORT}`);
  });
}

bootstrap();
