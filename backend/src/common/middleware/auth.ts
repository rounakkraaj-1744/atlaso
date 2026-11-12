import type { NextFunction, Request, Response } from 'express';
import { auth } from '../../modules/auth/auth.js';

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') 
        headers.set(key, value);
      else if (Array.isArray(value)) 
        headers.set(key, value.join(', '));
    }
    const session = await auth.api.getSession({ headers });
    if (!session) {
      res.status(401).json({ success: false, message: 'Authentication required', timestamp: new Date().toISOString() });
      return;
    }
    req.userId = session.user.id;
    next();
  } catch (error) {
    next(error);
  }
}