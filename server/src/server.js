import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app/app.js';
import { connectDatabase } from './config/db.config.js';
import './models/index.js';
import User from './models/Users.js';

await connectDatabase();
await User.init();
const app = createApp({
  mongoUrl: process.env.MONGODB_URI,
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
