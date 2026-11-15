import { Router } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../infrastructure/database/client.js';
import { architectures, projects } from '../../infrastructure/database/schema.js';
import { createArchitectureSchema, providerMappingSchema, updateArchitectureSchema } from './architecture.schemas.js';
import { createCanvasDocument, patchOwnedArchitecture, toCanvasDocument } from './architecture.repository.js';
import { CanvasServiceError, getCanvas, putCanvas } from './canvas.service.js';
import type { CanvasDocument } from './canvas.schemas.js';
import { paginationSchema } from '../projects/projects.schemas.js';

export const architecturesRouter = Router();
architecturesRouter.param('id', (_req, res, next, value) => {
  if (!z.string().uuid().safeParse(value).success) {
    res.status(400).json({ success: false, message: 'Invalid architecture ID', timestamp: new Date().toISOString() });
    return;
  }
  next();
});

const stamp = () => new Date().toISOString();

const dto = (row: typeof architectures.$inferSelect) => ({
  id: row.id, projectId: row.projectId, name: row.name, description: row.description, type: row.type,
  version: row.version, parentId: null, providerProfile: row.providerProfile,
  nodes: row.nodes, edges: row.edges, canvasMetadata: row.canvasMetadata,
  document: { nodes: row.nodes, connections: row.edges, metadata: row.canvasMetadata, providerProfile: row.providerProfile },
  createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
});

async function ownedArchitecture(id: string, userId: string) {
  const [row] = await db.select({ architecture: architectures })
    .from(architectures)
    .innerJoin(projects, eq(architectures.projectId, projects.id))
    .where(and(eq(architectures.id, id), eq(projects.ownerId, userId))).limit(1);
  return row?.architecture;
}

architecturesRouter.get('/', async (req, res) => {
  const { page, limit } = paginationSchema.parse(req.query);

  const rows = await db.select({ architecture: architectures })
    .from(architectures)
    .innerJoin(projects, eq(architectures.projectId, projects.id)).where(eq(projects.ownerId, req.userId!))
    .orderBy(desc(architectures.updatedAt)).limit(limit).offset((page - 1) * limit);

  const [totalRow] = await db.select({ count: sql<number>`count(*)::int` })
    .from(architectures)
    .innerJoin(projects, eq(architectures.projectId, projects.id)).where(eq(projects.ownerId, req.userId!));

  const total = totalRow?.count ?? 0;

  res.json({
    success: true,
    data: rows.map((row) => dto(row.architecture)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, timestamp: stamp()
  });
});

architecturesRouter.post('/', async (req, res) => {
  const input = createArchitectureSchema.parse(req.body);
  let projectId = input.projectId;

  if (!projectId) {
    const [project] = await db.insert(projects).values({ ownerId: req.userId!, name: input.name, description: '' }).returning();
    projectId = project!.id;
  } else {
    const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, req.userId!))).limit(1);
    if (!project)
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: stamp()
      });
  }
  const [row] = await db.insert(architectures).values({ ...input, projectId }).returning();
  await createCanvasDocument(row!.id, toCanvasDocument(input.nodes, input.edges, input.canvasMetadata, input.providerProfile));

  res.status(201).json({
    success: true,
    data: dto(row!),
    message: 'Architecture created successfully',
    timestamp: stamp()
  });
});

architecturesRouter.get('/:id', async (req, res) => {
  const row = await ownedArchitecture(req.params.id!, req.userId!);
  if (!row)
    return res.status(404).json({ success: false, message: 'Architecture not found', timestamp: stamp() });
  res.json({ success: true, data: dto(row), timestamp: stamp() });
});

architecturesRouter.patch('/:id', async (req, res) => {
  const input = updateArchitectureSchema.parse(req.body);
  const current = await ownedArchitecture(req.params.id!, req.userId!);

  if (!current)
    return res.status(404).json({ success: false, message: 'Architecture not found', timestamp: stamp() });

  if (input.expectedVersion !== undefined && input.expectedVersion !== current.version)
    return res.status(409).json({ success: false, message: 'Architecture changed since it was loaded', data: { currentVersion: current.version }, timestamp: stamp() });

  const { expectedVersion: _expectedVersion, ...changes } = input;
  const result = await patchOwnedArchitecture(current.id, req.userId!, current.version, changes);
  if (result.kind === 'not-found') return res.status(404).json({ success: false, message: 'Architecture not found', timestamp: stamp() });
  if (result.kind === 'conflict') return res.status(409).json({ success: false, message: 'Architecture changed during save; reload and try again', data: { currentVersion: 'currentVersion' in result ? result.currentVersion : current.version }, timestamp: stamp() });

  res.json({
    success: true,
    data: dto(result.architecture),
    message: 'Architecture updated successfully',
    timestamp: stamp()
  });
});

architecturesRouter.delete('/:id', async (req, res) => {
  const current = await ownedArchitecture(req.params.id!, req.userId!);

  if (!current)
    return res.status(404).json({ success: false, message: 'Architecture not found', timestamp: stamp() });

  await db.delete(architectures).where(eq(architectures.id, current.id));

  res.json({
    success: true,
    data: null,
    timestamp: stamp()
  });
});

architecturesRouter.post('/:id/fork', async (req, res) => {
  const current = await ownedArchitecture(req.params.id!, req.userId!);

  if (!current)
    return res.status(404).json({
      success: false,
      message: 'Architecture not found',
      timestamp: stamp()
    });

  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : `${current.name} copy`;
  const [row] = await db.insert(architectures).values({ projectId: current.projectId, name, description: current.description, type: current.type, providerProfile: current.providerProfile, nodes: current.nodes, edges: current.edges, canvasMetadata: current.canvasMetadata }).returning();

  res.status(201).json({
    success: true,
    data: dto(row!),
    timestamp: stamp()
  });
});

architecturesRouter.post('/:id/provider-mapping', async (req, res) => {
  const { provider, mode, nodes: submittedNodes, edges: submittedEdges, canvasMetadata } = providerMappingSchema.extend({
    nodes: createArchitectureSchema.shape.nodes.optional(),
    edges: createArchitectureSchema.shape.edges.optional(),
    canvasMetadata: createArchitectureSchema.shape.canvasMetadata.optional(),
  }).parse(req.body);
  const current = await ownedArchitecture(req.params.id!, req.userId!);
  if (!current) return res.status(404).json({ success: false, message: 'Architecture not found', timestamp: stamp() });
  const canvas = await getCanvas(current.id, req.userId!);
  const nodes = (submittedNodes ?? canvas.document.nodes).map((item): CanvasDocument['nodes'][number] => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item as CanvasDocument['nodes'][number];
    const node = item as Record<string, unknown>;
    const mapping = node.providerMapping && typeof node.providerMapping === 'object' ? node.providerMapping as Record<string, unknown> : {};
    if (mode === 'keep-manual' && mapping.mappingStatus === 'manual') return node as CanvasDocument['nodes'][number];
    const technology = providerTechnology(provider, String(node.type ?? ''));
    return { ...node, providerMapping: { provider, technology, mappingStatus: 'profile' } } as unknown as CanvasDocument['nodes'][number];
  });
  const submittedMetadata = canvasMetadata ?? {};
  const { viewport: submittedViewport, ...metadataUpdates } = submittedMetadata;
  const document: CanvasDocument = {
    ...canvas.document,
    nodes,
    connections: submittedEdges ?? canvas.document.connections,
    providerProfile: provider,
    ...(submittedViewport && typeof submittedViewport === 'object' ? { viewport: submittedViewport as { x: number; y: number; zoom: number } } : {}),
    metadata: { ...(canvas.document.metadata as Record<string, unknown> ?? {}), ...metadataUpdates },
  };
  let savedCanvas: Awaited<ReturnType<typeof putCanvas>>;
  try {
    savedCanvas = await putCanvas(current.id, req.userId!, canvas.revision, document, {});
  } catch (error) {
    if (error instanceof CanvasServiceError && error.status === 409) return res.status(409).json({ success: false, message: error.message, timestamp: stamp() });
    throw error;
  }
  const row = await ownedArchitecture(current.id, req.userId!);
  if (!row) return res.status(404).json({ success: false, message: 'Architecture not found', timestamp: stamp() });
  res.json({ success: true, data: { ...dto(row), document: savedCanvas.document, revision: savedCanvas.revision }, timestamp: stamp() });
});

function providerTechnology(provider: string, type: string): string {
  if (provider === 'Generic') return type;
  const map: Record<string, Record<string, string>> = {
    AWS: { authentication: 'AWS Cognito', 'relational-db': 'Amazon RDS', 'object-storage': 'Amazon S3', redis: 'Amazon ElastiCache' },
    Azure: { authentication: 'Microsoft Entra ID', 'relational-db': 'Azure SQL Database', 'object-storage': 'Azure Blob Storage', redis: 'Azure Cache for Redis' },
    'Google Cloud': { authentication: 'Identity Platform', 'relational-db': 'Cloud SQL', 'object-storage': 'Cloud Storage', redis: 'Memorystore' },
    Cloudflare: { authentication: 'Cloudflare Access', 'relational-db': 'D1', 'object-storage': 'R2', redis: 'Workers KV' },
    Civo: { authentication: 'Civo IAM', 'relational-db': 'Civo Database', 'object-storage': 'Civo Object Store', redis: 'Civo Database' },
  };
  return map[provider]?.[type] ?? `${provider} managed ${type}`;
}
