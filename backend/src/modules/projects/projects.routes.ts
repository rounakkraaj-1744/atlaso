import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../infrastructure/database/client.js';
import { architectures, projects } from '../../infrastructure/database/schema.js';

export const projectsRouter = Router();
const projectInput = z.object({ name: z.string().trim().min(1).max(160), description: z.string().max(10000).default('') });
const stamp = () => new Date().toISOString();
const projectDto = (row: typeof projects.$inferSelect) => ({ id: row.id, name: row.name, description: row.description, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });

projectsRouter.get('/', async (req, res) => {
  const rows = await db.select().from(projects).where(eq(projects.ownerId, req.userId!)).orderBy(desc(projects.updatedAt));
  res.json({
    success: true,
    data: rows.map(projectDto),
    timestamp: stamp()
  });
});

projectsRouter.post('/', async (req, res) => {
  const input = projectInput.parse(req.body);
  const [row] = await db.insert(projects).values({ ...input, ownerId: req.userId! }).returning();
  res.status(201).json({
    success: true,
    data: projectDto(row!),
    timestamp: stamp()
  });
});

projectsRouter.get('/:projectId', async (req, res) => {
  const [row] = await db.select().from(projects).where(and(eq(projects.id, req.params.projectId!), eq(projects.ownerId, req.userId!))).limit(1);
  if (!row)
    return res.status(404).json({
      success: false,
      message: 'Project not found',
      timestamp: stamp()
    });
  const archs = await db.select().from(architectures).where(eq(architectures.projectId, row.id)).orderBy(desc(architectures.updatedAt));
  res.json({
    success: true,
    data: {
      ...projectDto(row),
      architectures: archs
    },
    timestamp: stamp()
  });
});

projectsRouter.patch('/:projectId', async (req, res) => {
  const input = projectInput.partial().parse(req.body);
  const [row] = await db.update(projects).set({ ...input, updatedAt: new Date() }).where(and(eq(projects.id, req.params.projectId!), eq(projects.ownerId, req.userId!))).returning();
  if (!row)
    return res.status(404).json({
      success: false,
      message: 'Project not found',
      timestamp: stamp()
    });
  res.json({
    success: true,
    data: projectDto(row),
    timestamp: stamp()
  });
});

projectsRouter.delete('/:projectId', async (req, res) => {
  const rows = await db.delete(projects).where(and(eq(projects.id, req.params.projectId!), eq(projects.ownerId, req.userId!))).returning({ id: projects.id });
  if (!rows.length)
    return res.status(404).json({
      success: false,
      message: 'Project not found',
      timestamp: stamp()
    });
  res.json({
    success: true,
    data: null,
    timestamp: stamp()
  });
});
