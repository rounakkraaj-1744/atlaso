import assert from 'node:assert/strict';
import test from 'node:test';
import { createArchitectureSchema, architectureTypeSchema } from '../src/modules/architectures/architecture.schemas.js';
import { createTestContext, databaseIntegrationTestsEnabled } from '../src/testing/test-server.js';

test('architecture schema supports each documented type and rejects unknown types', () => {
  for (const type of ['HLD', 'LLD', 'DATABASE', 'DEPLOYMENT'] as const) {
    assert.equal(architectureTypeSchema.parse(type), type);
    assert.equal(createArchitectureSchema.safeParse({ name: `Design ${type}`, type }).success, true);
  }
  assert.equal(createArchitectureSchema.safeParse({ name: 'Invalid', type: 'SERVICE' }).success, false);
});

test('architecture endpoints create, list, retrieve, update, delete, and enforce ownership', { skip: !databaseIntegrationTestsEnabled }, async () => {
  const context = await createTestContext();
  try {
    const owner = await context.createUser('architecture-owner');
    const other = await context.createUser('architecture-other');
    const project = await context.request<{ data: { id: string } }>('/api/v1/projects', owner, {
      method: 'POST', body: JSON.stringify({ name: 'Architecture test project' }),
    });
    const projectId = project.body.data.id;
    const architectureIds: string[] = [];

    for (const type of ['HLD', 'LLD', 'DATABASE', 'DEPLOYMENT'] as const) {
      const created = await context.request<{ data: { id: string; type: string; projectId: string } }>(`/api/v1/projects/${projectId}/architectures`, owner, {
        method: 'POST', body: JSON.stringify({ name: `${type} design`, type }),
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.data.type, type);
      assert.equal(created.body.data.projectId, projectId);
      architectureIds.push(created.body.data.id);
    }

    const list = await context.request<{ data: Array<{ id: string; type: string }>; pagination: { total: number } }>(`/api/v1/projects/${projectId}/architectures?page=1&limit=2`, owner);
    assert.equal(list.body.data.length, 2);
    assert.equal(list.body.pagination.total, 4);
    const architectureId = architectureIds[0]!;
    const fetched = await context.request<{ data: { name: string } }>(`/api/v1/architectures/${architectureId}`, owner);
    assert.equal(fetched.body.data.name, 'HLD design');

    const updated = await context.request<{ data: { name: string; version: number } }>(`/api/v1/architectures/${architectureId}`, owner, {
      method: 'PATCH', body: JSON.stringify({
        name: 'Updated HLD', expectedVersion: 1,
        nodes: [{ id: 'patched-node', type: 'api-server', position: { x: 12, y: 36 }, config: { name: 'API', runtime: 'custom' } }],
        edges: [],
      }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, 'Updated HLD');
    assert.equal(updated.body.data.version, 2);
    const patchedCanvas = await context.request<{ data: { revision: number; document: { nodes: unknown[] } } }>(`/api/v1/architectures/${architectureId}/canvas`, owner);
    assert.equal(patchedCanvas.body.data.revision, 2);
    assert.equal(patchedCanvas.body.data.document.nodes[0] && (patchedCanvas.body.data.document.nodes[0] as { id: string }).id, 'patched-node');

    assert.equal((await context.request(`/api/v1/architectures/${architectureId}`, other)).status, 404);
    assert.equal((await context.request(`/api/v1/architectures/${architectureId}`, other, { method: 'PATCH', body: JSON.stringify({ name: 'Nope' }) })).status, 404);
    assert.equal((await context.request(`/api/v1/architectures/${architectureId}`, other, { method: 'DELETE' })).status, 404);
    assert.equal((await context.request(`/api/v1/architectures/${architectureId}`, owner, { method: 'DELETE' })).status, 200);
  } finally {
    await context.dispose();
  }
});
