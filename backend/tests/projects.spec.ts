import assert from 'node:assert/strict';
import test from 'node:test';
import { paginationSchema, projectCreateSchema, projectUpdateSchema } from '../src/modules/projects/projects.schemas.js';
import { createTestContext, databaseIntegrationTestsEnabled } from '../src/testing/test-server.js';

test('project request schemas validate names, descriptions, and pagination', () => {
  assert.deepEqual(projectCreateSchema.parse({ name: '  Payments  ' }), { name: 'Payments', description: '' });
  assert.equal(projectCreateSchema.safeParse({ name: ' ' }).success, false);
  assert.equal(projectUpdateSchema.safeParse({ description: 'Updated' }).success, true);
  assert.deepEqual(paginationSchema.parse({ page: '2', limit: '10' }), { page: 2, limit: 10 });
  assert.equal(paginationSchema.safeParse({ page: '0' }).success, false);
  assert.equal(paginationSchema.safeParse({ limit: '101' }).success, false);
});

test('project endpoints create, list, page, retrieve, update, delete, and isolate owners', { skip: !databaseIntegrationTestsEnabled }, async () => {
  const context = await createTestContext();
  try {
    const owner = await context.createUser('project-owner');
    const other = await context.createUser('other-owner');
    const created = await context.request<{ data: { id: string; name: string } }>('/api/v1/projects', owner, {
      method: 'POST', body: JSON.stringify({ name: 'Payments', description: 'Payment system' }),
    });
    assert.equal(created.status, 201);
    const projectId = created.body.data.id;

    await context.request('/api/v1/projects', owner, { method: 'POST', body: JSON.stringify({ name: 'Orders' }) });
    await context.request('/api/v1/projects', owner, { method: 'POST', body: JSON.stringify({ name: 'Identity' }) });
    const list = await context.request<{ data: Array<{ id: string }>; pagination: { total: number } }>('/api/v1/projects?page=1&limit=2', owner);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 2);
    assert.equal(list.body.pagination.total, 3);
    const secondPage = await context.request<{ data: Array<{ id: string }> }>('/api/v1/projects?page=2&limit=2', owner);
    assert.equal(secondPage.body.data.length, 1);

    const retrieved = await context.request<{ data: { id: string; name: string } }>(`/api/v1/projects/${projectId}`, owner);
    assert.equal(retrieved.body.data.name, 'Payments');
    const updated = await context.request<{ data: { name: string; description: string } }>(`/api/v1/projects/${projectId}`, owner, {
      method: 'PATCH', body: JSON.stringify({ name: 'Payments v2', description: 'Updated' }),
    });
    assert.equal(updated.body.data.name, 'Payments v2');
    assert.equal(updated.body.data.description, 'Updated');

    assert.equal((await context.request(`/api/v1/projects/${projectId}`, other)).status, 404);
    assert.equal((await context.request(`/api/v1/projects/${projectId}`, other, { method: 'PATCH', body: JSON.stringify({ name: 'stolen' }) })).status, 404);
    assert.equal((await context.request(`/api/v1/projects/${projectId}`, other, { method: 'DELETE' })).status, 404);
    assert.equal((await context.request(`/api/v1/projects/${projectId}`, owner, { method: 'DELETE' })).status, 200);
    assert.equal((await context.request(`/api/v1/projects/${projectId}`, owner)).status, 404);
  } finally {
    await context.dispose();
  }
});
