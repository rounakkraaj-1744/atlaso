import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { env } from './config/env.js';
import { auth } from './modules/auth/auth.js';
import { requireAuth } from './common/middleware/auth.js';
import { errorHandler, notFound } from './common/errors/handler.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { architecturesRouter } from './modules/architectures/architectures.routes.js';
import { canvasRouter } from './modules/architectures/canvas.routes.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await (await import('./infrastructure/database/client.js')).pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/architecture', requireAuth, architecturesRouter);
app.use('/api/v1/projects', requireAuth, projectsRouter);
app.use('/api/v1/architectures', requireAuth, architecturesRouter);
app.use('/api/v1/architectures', requireAuth, canvasRouter);
app.use(notFound);
app.use(errorHandler);
