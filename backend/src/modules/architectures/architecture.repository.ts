import { and, eq } from 'drizzle-orm';
import { db } from '../../infrastructure/database/client.js';
import { architectureDocuments, architectures, projects } from '../../infrastructure/database/schema.js';
import type { CanvasDocument } from './canvas.schemas.js';

export function toCanvasDocument(nodes: unknown[], connections: unknown[], metadata: Record<string, unknown>, providerProfile: string): CanvasDocument {
  const { viewport, ...settings } = metadata;
  return {
    nodes: nodes as CanvasDocument['nodes'],
    connections: connections as CanvasDocument['connections'],
    viewport: viewport && typeof viewport === 'object' ? viewport as { x: number; y: number; zoom: number } : { x: 0, y: 0, zoom: 1 },
    metadata: settings,
    providerProfile,
  };
}

export async function findOwnedArchitecture(architectureId: string, ownerId: string) {
  const [row] = await db.select({ architecture: architectures })
    .from(architectures)
    .innerJoin(projects, eq(projects.id, architectures.projectId))
    .where(and(eq(architectures.id, architectureId), eq(projects.ownerId, ownerId)))
    .limit(1);
  return row?.architecture;
}

export async function createCanvasDocument(architectureId: string, document: CanvasDocument) {
  await db.insert(architectureDocuments).values({ architectureId, document }).onConflictDoNothing({ target: architectureDocuments.architectureId });
}

export async function findCanvasDocument(architectureId: string) {
  const [row] = await db.select().from(architectureDocuments)
    .where(eq(architectureDocuments.architectureId, architectureId)).limit(1);
  return row;
}

export async function saveCanvasDocument(architectureId: string, expectedRevision: number, document: CanvasDocument, metadata: { name?: string; description?: string; type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT' } = {}) {
  return db.transaction(async (tx) => {
    const [saved] = await tx.update(architectureDocuments)
      .set({ document, revision: expectedRevision + 1, updatedAt: new Date() })
      .where(and(eq(architectureDocuments.architectureId, architectureId), eq(architectureDocuments.revision, expectedRevision)))
      .returning();
    if (!saved) return null;

    const [architecture] = await tx.select({ projectId: architectures.projectId })
      .from(architectures).where(eq(architectures.id, architectureId)).limit(1);
    if (!architecture) return null;
    const canvasMetadata = Object.fromEntries(Object.entries(document).filter(([key]) => key !== 'nodes' && key !== 'connections'));
    await tx.update(architectures).set({
      nodes: document.nodes,
      edges: document.connections,
      canvasMetadata,
      updatedAt: saved.updatedAt,
      ...metadata,
    }).where(eq(architectures.id, architectureId));
    await tx.update(projects).set({ updatedAt: saved.updatedAt }).where(eq(projects.id, architecture.projectId));
    return saved;
  });
}
