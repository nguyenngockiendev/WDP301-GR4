import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { createApiRouter } from './routes.js';

export function createApp({ mongoUrl, secret, store, production = false }) {
  if (!secret || secret.length < 32)
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '20kb' }));
  app.use(
    '/api',
    session({
      name: 'boarding.sid',
      secret,
      resave: false,
      saveUninitialized: false,
      store: store ?? MongoStore.create({ mongoUrl }),
      cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 28800000 },
    }),
  );
  app.use('/api', createApiRouter());
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found.' }));
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    res.status(status).json({
      message: status === 500 ? 'Something went wrong. Please try again.' : error.message,
    });
  });
  return app;
}
