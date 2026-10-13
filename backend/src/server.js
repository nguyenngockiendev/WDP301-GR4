import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import User from './modules/users/User.js';

const mongoUrl = process.env.MONGODB_URI;
if (!mongoUrl) throw new Error('Chưa cấu hình MONGODB_URI trong .env');

await mongoose.connect(mongoUrl);
await User.init();
const app = createApp({
  mongoUrl,
  secret: process.env.SESSION_SECRET,
  production: process.env.NODE_ENV === 'production',
});
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.log(`Backend API: http://localhost:${port}`));

async function shutDown() {
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
