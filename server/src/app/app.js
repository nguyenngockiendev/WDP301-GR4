import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import apiRoutes from './routes.js';
import { rateLimit } from 'express-rate-limit';
import { errorMiddleware, notFoundMiddleware } from '../shared/middlewares/error.middleware.js';

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-7', legacyHeaders: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'haven.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use('/api', apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
