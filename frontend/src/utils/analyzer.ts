import { CanvasNode, SystemConstraints, AnalysisResult, Suggestion, Connection } from '../types';

export function analyzeSystem(
  nodes: CanvasNode[],
  connections: Connection[],
  constraints: SystemConstraints
): { analysis: AnalysisResult; suggestions: Suggestion[] } {
  if (nodes.length === 0) {
    return {
      analysis: {
        verdict: 'pass',
        bottlenecks: [],
        warnings: [],
      },
      suggestions: [],
    };
  }

  const bottlenecks: AnalysisResult['bottlenecks'] = [];
  const warnings: AnalysisResult['warnings'] = [];
  const suggestions: Suggestion[] = [];

  // Analyze each node against constraints
  nodes.forEach((node) => {
    const effectiveThroughput = node.config.throughput * node.config.scalingFactor;
    
    // Check if node can handle peak load
    if (effectiveThroughput < constraints.peakRPS) {
      bottlenecks.push({
        nodeId: node.id,
        nodeName: node.config.name,
        severity: effectiveThroughput < constraints.avgRPS ? 'high' : 'medium',
        reason: `Throughput capacity (${effectiveThroughput.toLocaleString()} rps) is below peak load (${constraints.peakRPS.toLocaleString()} rps). Component will saturate and queue depth increases unbounded.`,
      });

      suggestions.push({
        id: `scale-${node.id}`,
        title: `Increase ${node.config.name} scaling factor`,
        why: `Current throughput (${effectiveThroughput.toLocaleString()} rps) cannot sustain peak load. Scaling to ${Math.ceil(constraints.peakRPS / node.config.throughput)}x would provide headroom.`,
        tradeoff: 'Increased infrastructure cost and operational complexity.',
        impact: 'high',
      });
    }

    // Check latency violations
    if (node.config.latency > constraints.slaLatency) {
      warnings.push({
        type: 'latency-violation',
        message: `${node.config.name} p95 latency (${node.config.latency}ms) exceeds SLA target (${constraints.slaLatency}ms). End-to-end latency will violate requirements.`,
      });

      // Suggest caching for high-latency reads
      if (node.type === 'postgresql' || node.type === 'mongodb') {
        const hasRedis = nodes.some((n) => n.type === 'redis');
        if (!hasRedis && constraints.readWriteRatio > 70) {
          suggestions.push({
            id: `cache-${node.id}`,
            title: 'Add Redis caching layer',
            why: 'Read-heavy workload (${constraints.readWriteRatio}% reads) with high DB latency. Cache hit can reduce p95 to sub-millisecond.',
            tradeoff: 'Cache invalidation complexity and eventual consistency window.',
            impact: 'high',
          });
        }
      }
    }
  });

  // Check for async boundaries in sync paths
  const syncChains = findSyncChains(nodes, connections);
  syncChains.forEach((chain) => {
    const totalLatency = chain.reduce((sum, nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      return sum + (node?.config.latency || 0);
    }, 0);

    if (totalLatency > constraints.slaLatency) {
      warnings.push({
        type: 'latency-violation',
        message: `Synchronous chain latency (${totalLatency}ms) exceeds SLA (${constraints.slaLatency}ms). Consider introducing async boundaries.`,
      });

      const hasQueue = nodes.some((n) => n.type === 'kafka' || n.type === 'rabbitmq' || n.type === 'bullmq');
      if (!hasQueue) {
        suggestions.push({
          id: 'async-boundary',
          title: 'Introduce async message queue',
          why: 'Breaking synchronous dependency chain allows non-critical operations to be deferred, reducing user-facing latency.',
          tradeoff: 'Eventual consistency and increased system complexity.',
          impact: 'high',
        });
      }
    }
  });

  // Check queue consumer throughput
  const queueNodes = nodes.filter((n) => n.type === 'kafka' || n.type === 'rabbitmq' || n.type === 'bullmq');
  queueNodes.forEach((queue) => {
    const producers = connections
      .filter((c) => c.targetId === queue.id)
      .map((c) => nodes.find((n) => n.id === c.sourceId))
      .filter((n): n is CanvasNode => n !== undefined);

    const consumers = connections
      .filter((c) => c.sourceId === queue.id)
      .map((c) => nodes.find((n) => n.id === c.targetId))
      .filter((n): n is CanvasNode => n !== undefined);

    const producerRate = producers.reduce((sum, p) => sum + p.config.throughput * p.config.scalingFactor, 0);
    const consumerRate = consumers.reduce((sum, c) => sum + c.config.throughput * c.config.scalingFactor, 0);

    if (consumerRate < producerRate) {
      const lagTime = Math.round((producerRate - consumerRate) / consumerRate * 60);
      warnings.push({
        type: 'queue-growth',
        message: `${queue.config.name} consumer throughput (${consumerRate.toLocaleString()} rps) is lower than producer rate (${producerRate.toLocaleString()} rps). Consumer lag increases unbounded after ~${lagTime} seconds.`,
      });

      suggestions.push({
        id: `consumer-${queue.id}`,
        title: `Increase ${queue.config.name} consumer parallelism`,
        why: `Producer rate exceeds consumer capacity. Scaling consumers to match ${producerRate.toLocaleString()} rps eliminates lag growth.`,
        tradeoff: 'Increased compute cost and potential out-of-order processing.',
        impact: 'high',
      });
    }
  });

  // Determine overall verdict
  let verdict: AnalysisResult['verdict'] = 'pass';
  if (bottlenecks.some((b) => b.severity === 'high')) {
    verdict = 'fail';
  } else if (bottlenecks.length > 0 || warnings.length > 0) {
    verdict = 'risky';
  }

  return {
    analysis: { verdict, bottlenecks, warnings },
    suggestions,
  };
}

function findSyncChains(nodes: CanvasNode[], connections: Connection[]): string[][] {
  const syncConnections = connections.filter((c) => c.type === 'sync');
  const chains: string[][] = [];

  // Simple implementation: find linear sync paths
  // In production, this would use graph traversal
  const visited = new Set<string>();

  syncConnections.forEach((conn) => {
    if (!visited.has(conn.sourceId)) {
      const chain = [conn.sourceId, conn.targetId];
      visited.add(conn.sourceId);
      visited.add(conn.targetId);
      chains.push(chain);
    }
  });

  return chains;
}
