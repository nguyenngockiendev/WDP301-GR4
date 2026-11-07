import dotenv from 'dotenv';
dotenv.config();

export const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
].filter(Boolean));
