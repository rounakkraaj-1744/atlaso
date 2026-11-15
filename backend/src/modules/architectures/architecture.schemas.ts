import { z } from 'zod';

export const architectureTypeSchema = z.enum(['HLD', 'LLD', 'DATABASE', 'DEPLOYMENT']);

export const canvasNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).passthrough()
}).passthrough();

export const canvasEdgeSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1)
}).passthrough();

export const createArchitectureSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(10000).default(''),
  projectId: z.string().uuid().optional(),
  type: architectureTypeSchema.default('HLD'),
  nodes: z.array(canvasNodeSchema).default([]),
  edges: z.array(canvasEdgeSchema).default([]),
  canvasMetadata: z.record(z.string(), z.unknown()).default({}),
  providerProfile: z.string().max(80).default('Generic'),
});

export const updateArchitectureSchema = createArchitectureSchema.omit({ projectId: true }).partial().extend({
  expectedVersion: z.number().int().positive().optional()
});

export const providerMappingSchema = z.object({
  provider: z.string().min(1).max(80),
  mode: z.enum(['replace-all', 'keep-manual'])
});

export type CreateArchitecture = z.infer<typeof createArchitectureSchema>;
export type UpdateArchitecture = z.infer<typeof updateArchitectureSchema>;
