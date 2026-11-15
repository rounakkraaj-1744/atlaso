import { and, eq } from 'drizzle-orm';
import { db } from '../../infrastructure/database/client.js';
import { architectureDocuments, architectures, projects } from '../../infrastructure/database/schema.js';
import type { CanvasDocument } from './canvas.schemas.js';
import type { UpdateArchitecture } from './architecture.schemas.js';

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

export async function patchOwnedArchitecture(architectureId: string, ownerId: string, expectedVersion: number, changes: Omit<UpdateArchitecture, 'expectedVersion'>) {
  try {
    return await db.transaction(async (tx) => {
      const [owned] = await tx.select({ architecture: architectures })
        .from(architectures)
        .innerJoin(projects, eq(projects.id, architectures.projectId))
        .where(and(eq(architectures.id, architectureId), eq(projects.ownerId, ownerId)))
        .limit(1);
      if (!owned) return { kind: 'not-found' as const };
      const current = owned.architecture;
      if (current.version !== expectedVersion) return { kind: 'conflict' as const, currentVersion: current.version };

      const now = new Date();
      const changesCanvas = changes.nodes !== undefined || changes.edges !== undefined || changes.canvasMetadata !== undefined || changes.providerProfile !== undefined;
      let nextDocument: CanvasDocument | undefined;
      if (changesCanvas) {
        let [documentRow] = await tx.select().from(architectureDocuments)
          .where(eq(architectureDocuments.architectureId, current.id)).limit(1);
        if (!documentRow) {
          const legacyDocument = toCanvasDocument(
            Array.isArray(current.nodes) ? current.nodes : [],
            Array.isArray(current.edges) ? current.edges : [],
            current.canvasMetadata as Record<string, unknown>,
            current.providerProfile,
          );
          await tx.insert(architectureDocuments).values({ architectureId: current.id, document: legacyDocument });
          [documentRow] = await tx.select().from(architectureDocuments)
            .where(eq(architectureDocuments.architectureId, current.id)).limit(1);
        }
        if (!documentRow) throw new Error('Canvas document could not be initialized during architecture update');

        const previous = documentRow.document as CanvasDocument;
        const canvasSettings = changes.canvasMetadata;
        const { viewport: changedViewport, ...changedMetadata } = canvasSettings ?? {};
        nextDocument = {
          ...previous,
          ...(changes.nodes === undefined ? {} : { nodes: changes.nodes as CanvasDocument['nodes'] }),
          ...(changes.edges === undefined ? {} : { connections: changes.edges as CanvasDocument['connections'] }),
          ...(canvasSettings === undefined ? {} : { metadata: changedMetadata }),
          ...(changedViewport && typeof changedViewport === 'object' ? { viewport: changedViewport as { x: number; y: number; zoom: number } } : {}),
          ...(changes.providerProfile === undefined ? {} : { providerProfile: changes.providerProfile }),
        };
        const [savedDocument] = await tx.update(architectureDocuments)
          .set({ document: nextDocument, revision: documentRow.revision + 1, updatedAt: now })
          .where(and(eq(architectureDocuments.architectureId, current.id), eq(architectureDocuments.revision, documentRow.revision)))
          .returning();
        if (!savedDocument) throw new Error('CANVAS_REVISION_CHANGED');
      }

      const [updated] = await tx.update(architectures)
        .set({
          name: changes.name,
          description: changes.description,
          type: changes.type,
          providerProfile: changes.providerProfile,
          version: current.version + 1,
          updatedAt: now,
        })
        .where(and(eq(architectures.id, current.id), eq(architectures.version, current.version)))
        .returning();
      if (!updated) return { kind: 'conflict' as const, currentVersion: current.version };

      if (nextDocument) {
        const document = nextDocument;
        const metadata = document.metadata && typeof document.metadata === 'object' ? document.metadata as Record<string, unknown> : {};
        await tx.update(architectures).set({
          nodes: document.nodes,
          edges: document.connections,
          canvasMetadata: { ...metadata, ...(document.viewport ? { viewport: document.viewport } : {}) },
          providerProfile: typeof document.providerProfile === 'string' ? document.providerProfile : current.providerProfile,
          updatedAt: now,
        }).where(eq(architectures.id, current.id));
      }
      await tx.update(projects).set({ updatedAt: now }).where(eq(projects.id, current.projectId));
      const [result] = await tx.select().from(architectures).where(eq(architectures.id, current.id)).limit(1);
      return result ? { kind: 'success' as const, architecture: result } : { kind: 'not-found' as const };
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'CANVAS_REVISION_CHANGED') return { kind: 'conflict' as const };
    throw error;
  }
}
