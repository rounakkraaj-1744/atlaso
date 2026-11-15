import { Router } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../infrastructure/database/client.js';
import { architectures, projects } from '../../infrastructure/database/schema.js';
import { createCanvasDocument, toCanvasDocument } from '../architectures/architecture.repository.js';
import { createArchitectureSchema } from '../architectures/architecture.schemas.js';
import { paginationSchema, projectCreateSchema, projectUpdateSchema } from './projects.schemas.js';

export const projectsRouter = Router();
projectsRouter.param('projectId', (_req, res, next, value) => {
  if (!z.string().uuid().safeParse(value).success) {
    res.status(400).json({ success: false, message: 'Invalid project ID', timestamp: new Date().toISOString() });
    return;
  }
  next();
});
const stamp = () => new Date().toISOString();
const projectDto = (row: typeof projects.$inferSelect) => ({ id: row.id, name: row.name, description: row.description, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
const architectureDto = (row: typeof architectures.$inferSelect) => ({ id: row.id, projectId: row.projectId, name: row.name, description: row.description, type: row.type, version: row.version, providerProfile: row.providerProfile, nodes: row.nodes, edges: row.edges, canvasMetadata: row.canvasMetadata, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });

projectsRouter.get('/', async (req, res) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const rows = await db.select().from(projects).where(eq(projects.ownerId, req.userId!)).orderBy(desc(projects.updatedAt)).limit(limit).offset((page - 1) * limit);
  const [count] = await db.select({ value: sql<number>`count(*)::int` }).from(projects).where(eq(projects.ownerId, req.userId!));
  const total = count?.value ?? 0;
  res.json({
    success: true,
    data: rows.map(projectDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    timestamp: stamp()
  });
});

projectsRouter.post('/', async (req, res) => {
  const input = projectCreateSchema.parse(req.body);
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
      architectures: archs.map(architectureDto)
    },
    timestamp: stamp()
  });
});

projectsRouter.get('/:projectId/architectures', async (req, res) => {
  const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, req.params.projectId!), eq(projects.ownerId, req.userId!))).limit(1);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found', timestamp: stamp() });
  const { page, limit } = paginationSchema.parse(req.query);
  const rows = await db.select().from(architectures).where(eq(architectures.projectId, project.id)).orderBy(desc(architectures.updatedAt)).limit(limit).offset((page - 1) * limit);
  const [count] = await db.select({ value: sql<number>`count(*)::int` }).from(architectures).where(eq(architectures.projectId, project.id));
  const total = count?.value ?? 0;
  res.json({ success: true, data: rows.map(architectureDto), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, timestamp: stamp() });
});

projectsRouter.post('/:projectId/architectures', async (req, res) => {
  const input = createArchitectureSchema.omit({ projectId: true }).parse(req.body);
  const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, req.params.projectId!), eq(projects.ownerId, req.userId!))).limit(1);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found', timestamp: stamp() });
  const [row] = await db.insert(architectures).values({ ...input, projectId: project.id }).returning();
  await createCanvasDocument(row!.id, toCanvasDocument(input.nodes, input.edges, input.canvasMetadata, input.providerProfile));
  res.status(201).json({ success: true, data: architectureDto(row!), timestamp: stamp() });
});

projectsRouter.patch('/:projectId', async (req, res) => {
  const input = projectUpdateSchema.parse(req.body);
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
