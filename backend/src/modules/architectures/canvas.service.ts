import { findCanvasDocument, findOwnedArchitecture, createCanvasDocument, saveCanvasDocument } from './architecture.repository.js';
import type { CanvasDocument } from './canvas.schemas.js';

export class CanvasServiceError extends Error {
  constructor(message: string, readonly status: number, readonly currentRevision?: number) {
    super(message);
    this.name = 'CanvasServiceError';
  }
}

export async function getCanvas(architectureId: string, ownerId: string): Promise<{ architectureId: string; document: CanvasDocument; revision: number; updatedAt: string }> {
  const architecture = await findOwnedArchitecture(architectureId, ownerId);
  if (!architecture) throw new CanvasServiceError('Architecture not found', 404);

  let row = await findCanvasDocument(architectureId);
  if (!row) {
    const metadata = architecture.canvasMetadata && typeof architecture.canvasMetadata === 'object' ? architecture.canvasMetadata as Record<string, unknown> : {};
    const { viewport, ...otherMetadata } = metadata;
    const document = {
      nodes: Array.isArray(architecture.nodes) ? architecture.nodes as unknown[] : [],
      connections: Array.isArray(architecture.edges) ? architecture.edges as unknown[] : [],
      viewport: viewport && typeof viewport === 'object' ? viewport : { x: 0, y: 0, zoom: 1 },
      metadata: otherMetadata,
      providerProfile: architecture.providerProfile,
    } as CanvasDocument;
    await createCanvasDocument(architectureId, document);
    row = await findCanvasDocument(architectureId);
  }
  if (!row) throw new Error('Canvas document could not be initialized');
  return { architectureId, document: row.document as CanvasDocument, revision: row.revision, updatedAt: row.updatedAt.toISOString() };
}

export async function putCanvas(architectureId: string, ownerId: string, expectedRevision: number, document: CanvasDocument, metadata: { name?: string; description?: string; type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT' } = {}) {
  const architecture = await findOwnedArchitecture(architectureId, ownerId);
  if (!architecture) throw new CanvasServiceError('Architecture not found', 404);
  const existing = await findCanvasDocument(architectureId);
  if (!existing) {
    const initial = await getCanvas(architectureId, ownerId);
    if (initial.revision !== expectedRevision) throw new CanvasServiceError('Canvas changed since it was loaded', 409, initial.revision);
  }
  const saved = await saveCanvasDocument(architectureId, expectedRevision, document, metadata);
  if (!saved) {
    const current = await findCanvasDocument(architectureId);
    throw new CanvasServiceError('Canvas changed since it was loaded', 409, current?.revision);
  }
  return { architectureId, document: saved.document, revision: saved.revision, updatedAt: saved.updatedAt.toISOString() };
}
