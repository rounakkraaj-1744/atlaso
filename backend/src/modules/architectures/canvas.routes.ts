import { Router } from 'express';
import { z } from 'zod';
import { saveCanvasSchema } from './canvas.schemas.js';
import { getCanvas, putCanvas } from './canvas.service.js';

export const canvasRouter = Router();
canvasRouter.param('id', (_req, res, next, value) => {
  if (!z.string().uuid().safeParse(value).success) {
    res.status(400).json({ success: false, message: 'Invalid architecture ID', timestamp: new Date().toISOString() });
    return;
  }
  next();
});
const timestamp = () => new Date().toISOString();

canvasRouter.get('/:id/canvas', async (req, res) => {
  const data = await getCanvas(req.params.id!, req.userId!);
  res.json({ success: true, data, timestamp: timestamp() });
});

canvasRouter.put('/:id/canvas', async (req, res) => {
  const input = saveCanvasSchema.parse(req.body);
  const data = await putCanvas(req.params.id!, req.userId!, input.expectedRevision, input.document, { name: input.name, description: input.description, type: input.type });
  res.json({ success: true, data, timestamp: timestamp() });
});
