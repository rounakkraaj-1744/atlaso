import assert from 'node:assert/strict';
import test from 'node:test';
import { useArchitectureStore } from '../src/features/architecture/store';

test('canvas store restores viewport and full node and connection records without dropping extra fields', () => {
  const node = {
    id: 'node-1', type: 'api-server', position: { x: 74, y: -18 },
    config: { name: 'API', retry: { limit: 4 } }, technology: 'custom-runtime',
    providerMapping: { provider: 'AWS', technology: 'ECS', accountAlias: 'dev' },
  };
  const connection = { id: 'edge-1', sourceId: 'node-1', targetId: 'node-2', type: 'async', hasRetry: true, sourceHandle: 'write', protocol: 'grpc' };
  const store = useArchitectureStore.getState();
  store.loadCanvas([node as never], [connection as never], { x: -240, y: 62, zoom: 1.4 });
  store.setCanvasDocumentProperties({ settings: { grid: false }, customDocumentValue: { untouched: true } });

  const restored = useArchitectureStore.getState();
  assert.deepEqual(restored.nodes[0], node);
  
  assert.deepEqual(restored.connections[0], connection);
  assert.deepEqual(restored.viewport, { x: -240, y: 62, zoom: 1.4 });
  assert.deepEqual(restored.canvasDocumentProperties.customDocumentValue, { untouched: true });

  restored.loadCanvas([], [], { x: 0, y: 0, zoom: 1 });
  assert.deepEqual(useArchitectureStore.getState().canvasDocumentProperties, {});
});

test('canvas store avoids state changes when viewport values are unchanged and deletes connected edges with a node', () => {
  const initial = useArchitectureStore.getState();
  initial.loadCanvas(
    [{ id: 'node-a', type: 'api-server', position: { x: 0, y: 0 }, config: { name: 'API', throughput: 1, latency: 1, scalingFactor: 1, failureBehavior: 'retry', notes: '' }, status: 'healthy' }],
    [{ id: 'edge-a', sourceId: 'node-a', targetId: 'node-b', type: 'sync', hasRetry: false, hasBuffer: false }],
  );
  const stateBeforeSameViewport = useArchitectureStore.getState();
  useArchitectureStore.getState().setViewport({ x: 0, y: 0, zoom: 1 });
  assert.equal(useArchitectureStore.getState(), stateBeforeSameViewport);
  useArchitectureStore.getState().deleteNode('node-a');
  assert.equal(useArchitectureStore.getState().nodes.length, 0);
  assert.equal(useArchitectureStore.getState().connections.length, 0);
});
