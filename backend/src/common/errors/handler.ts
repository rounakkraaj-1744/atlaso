import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { CanvasServiceError } from '../../modules/architectures/canvas.service.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', timestamp: new Date().toISOString() });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof CanvasServiceError) {
    res.status(error.status).json({ success: false, message: error.message, ...(error.currentRevision === undefined ? {} : { data: { currentRevision: error.currentRevision } }), timestamp: new Date().toISOString() });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Request validation failed',
      errors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      })),
      timestamp: new Date().toISOString()
    });
    return;
  }
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
};
