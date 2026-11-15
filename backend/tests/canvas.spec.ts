import assert from 'node:assert/strict';
import test from 'node:test';
import { canvasDocumentSchema, saveCanvasSchema } from '../src/modules/architectures/canvas.schemas.js';
import { createTestContext, databaseIntegrationTestsEnabled } from '../src/testing/test-server.js';

const completeDocument = {
  nodes: [
    { id: 'web', type: 'web-client', category: 'traffic', label: 'Web app', position: { x: 90, y: 140 }, dimensions: { width: 280, height: 160 }, config: { name: 'Web', retries: 4, custom: { feature: true, threshold: 0.6 } }, technology: 'Next.js', providerMapping: { provider: 'AWS', technology: 'CloudFront', mappingStatus: 'manual' }, uiData: { color: '#223344' } },
    { id: 'database', type: 'postgresql', category: 'storage', label: 'Primary DB', position: { x: 570, y: 390 }, config: { name: 'Primary', replicas: 2 }, technology: 'PostgreSQL 17', providerMapping: { provider: 'Supabase', instance: 'db-custom' } },
  ],
  connections: [{ id: 'web-db', sourceId: 'web', targetId: 'database', sourceHandle: 'out', targetHandle: 'in', protocol: 'https', type: 'sync', config: { timeoutMs: 2400, headers: { trace: true } }, metadata: { dashed: false } }],
  viewport: { x: -164, y: 93, zoom: 1.35 },
  settings: { grid: true, snap: false, customSetting: ['one', 'two'] },
  metadata: { notes: { authoringTool: 'Atlaso' } },
};

test('canvas schema keeps unknown node, connection, and document properties', () => {
  assert.deepEqual(canvasDocumentSchema.parse(completeDocument), completeDocument);
  assert.equal(saveCanvasSchema.safeParse({ document: completeDocument, expectedRevision: 2 }).success, true);
  assert.equal(saveCanvasSchema.safeParse({ document: completeDocument, expectedRevision: 0 }).success, false);
});

test('canvas JSONB round trip is complete and stale writers receive 409 without overwriting', { skip: !databaseIntegrationTestsEnabled }, async () => {
  const context = await createTestContext();
  try {
    const owner = await context.createUser('canvas-owner');
    const other = await context.createUser('canvas-other');
    const project = await context.request<{ data: { id: string } }>('/api/v1/projects', owner, {
      method: 'POST', body: JSON.stringify({ name: 'Canvas project' }),
    });
    const created = await context.request<{ data: { id: string } }>(`/api/v1/projects/${project.body.data.id}/architectures`, owner, {
      method: 'POST', body: JSON.stringify({ name: 'Canvas architecture', type: 'HLD' }),
    });
    const architectureId = created.body.data.id;
    const initialA = await context.request<{ data: { revision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner);
    const initialB = await context.request<{ data: { revision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner);
    assert.equal(initialA.body.data.revision, initialB.body.data.revision);

    const saved = await context.request<{ data: { revision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner, {
      method: 'PUT', body: JSON.stringify({ document: completeDocument, expectedRevision: initialA.body.data.revision }),
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.data.revision, initialA.body.data.revision + 1);
    const fetched = await context.request<{ data: { document: unknown; revision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner);
    assert.deepEqual(fetched.body.data.document, completeDocument);

    const updatedDocument = structuredClone(completeDocument);
    updatedDocument.nodes[0]!.position.x = 710;
    updatedDocument.nodes[0]!.config.custom = { feature: false, threshold: 0.9 };
    updatedDocument.settings.customSetting.push('three');
    const clientA = await context.request<{ data: { revision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner, {
      method: 'PUT', body: JSON.stringify({ document: updatedDocument, expectedRevision: fetched.body.data.revision }),
    });
    assert.equal(clientA.status, 200);

    const clientB = await context.request<{ data: { currentRevision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner, {
      method: 'PUT', body: JSON.stringify({ document: completeDocument, expectedRevision: fetched.body.data.revision }),
    });
    assert.equal(clientB.status, 409);
    assert.equal(clientB.body.data.currentRevision, clientA.body.data.revision);
    const afterConflict = await context.request<{ data: { document: unknown; revision: number } }>(`/api/v1/architectures/${architectureId}/canvas`, owner);
    assert.deepEqual(afterConflict.body.data.document, updatedDocument);
    assert.equal(afterConflict.body.data.revision, clientA.body.data.revision);

    assert.equal((await context.request(`/api/v1/architectures/${architectureId}/canvas`, other)).status, 404);
    assert.equal((await context.request(`/api/v1/architectures/${architectureId}/canvas`, other, {
      method: 'PUT', body: JSON.stringify({ document: completeDocument, expectedRevision: afterConflict.body.data.revision }),
    })).status, 404);
  } finally {
    await context.dispose();
  }
});
