import { z } from 'zod';

export const canvasDocumentSchema = z.object({
  nodes: z.array(z.object({ id: z.string().min(1), type: z.string().min(1), position: z.object({ x: z.number(), y: z.number() }).passthrough() }).passthrough()),
  connections: z.array(z.object({ id: z.string().min(1), sourceId: z.string().min(1), targetId: z.string().min(1) }).passthrough()),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number().positive() }).passthrough().optional(),
}).passthrough();

export const saveCanvasSchema = z.object({
  document: canvasDocumentSchema,
  expectedRevision: z.number().int().positive(),
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(10000).optional(),
  type: z.enum(['HLD', 'LLD', 'DATABASE', 'DEPLOYMENT']).optional(),
});

export type CanvasDocument = z.infer<typeof canvasDocumentSchema>;
