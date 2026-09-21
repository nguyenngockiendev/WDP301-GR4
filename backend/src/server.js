import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import User from './entities/User.js';
if (!process.env.MONGODB_URI) throw new Error('Chưa cấu hình MONGODB_URI trong .env');
await mongoose.connect(process.env.MONGODB_URI);
await User.init();
const app = createApp({
  mongoUrl: process.env.MONGODB_URI,
  secret: process.env.SESSION_SECRET,
  production: process.env.NODE_ENV === 'production',
});
const server = app.listen(process.env.PORT || 4000, () =>
  console.log(`Backend API: http://localhost:${process.env.PORT || 4000}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }),
  );
