import express from 'express';
import helmet from 'helmet';
import { allowedOrigins } from '../config/origins.config.js';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import apiRoutes from './routes.js';
import { errorMiddleware, notFoundMiddleware } from '../shared/middlewares/error.middleware.js';

const app = express();
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), credentials: false }));
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
    return res.status(403).json({ success: false, message: 'Origin không được phép.' });
  }
  next();
});
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use('/api', apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
