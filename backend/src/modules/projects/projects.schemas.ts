import { z } from 'zod';

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(10000).default(''),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
