import { CanvasNode, SystemConstraints, AnalysisResult, Suggestion, Connection, AssumptionSource } from '../types';

/**
 * Calculate time to failure in seconds based on throughput deficit
 */
function calculateTimeToFailure(
  currentThroughput: number,
  requiredThroughput: number,
  bufferCapacity: number = 1000
): number {
  const deficit = requiredThroughput - currentThroughput;
  if (deficit <= 0) return Infinity;

  // Time = Buffer Capacity / Deficit Rate
  // Assuming a typical queue buffer of 1000 messages
  return Math.round(bufferCapacity / deficit);
}

/**
 * Find upstream sources for a given node
 */
function findUpstreamSources(nodeId: string, connections: Connection[]): string[] {
  return connections
    .filter(c => c.targetId === nodeId)
    .map(c => c.sourceId);
}

/**
 * Find downstream impacts for a given node
 */
function findDownstreamImpacts(nodeId: string, connections: Connection[]): string[] {
  return connections
    .filter(c => c.sourceId === nodeId)
    .map(c => c.targetId);
}

/**
 * Track assumption sources for a node
 */
function trackAssumptions(
  node: CanvasNode,
  defaultThroughput: number,
  defaultLatency: number
): AnalysisResult['assumptions'] {
  const assumptions: AnalysisResult['assumptions'] = [];

  // Check if using default throughput
  if (!node.assumptions?.throughput || node.assumptions.throughput === 'default') {
    assumptions.push({
      nodeId: node.id,
      nodeName: node.config.name,
      field: 'throughput',
      value: node.config.throughput,
      source: 'default',
      impact: 'high',
      explanation: `Using default throughput of ${node.config.throughput.toLocaleString()} rps. Actual capacity may differ significantly based on instance type, configuration, and workload characteristics.`,
    });
  }

  // Check if using default latency
  if (!node.assumptions?.latency || node.assumptions.latency === 'default') {
    assumptions.push({
      nodeId: node.id,
      nodeName: node.config.name,
      field: 'latency',
      value: node.config.latency,
      source: 'default',
      impact: 'medium',
      explanation: `Using default p95 latency of ${node.config.latency}ms. Real-world latency depends on network conditions, query complexity, and data size.`,
    });
  }

  // Check if using default scaling factor
  if (node.config.scalingFactor === 1) {
    assumptions.push({
      nodeId: node.id,
      nodeName: node.config.name,
      field: 'scalingFactor',
      value: 1,
      source: 'default',
      impact: 'high',
      explanation: `No horizontal scaling configured. Single instance will handle all load. Consider scaling to match expected throughput.`,
    });
  }

  return assumptions;
}

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
        assumptions: [],
      },
      suggestions: [],
    };
  }

  const bottlenecks: AnalysisResult['bottlenecks'] = [];
  const warnings: AnalysisResult['warnings'] = [];
  const suggestions: Suggestion[] = [];
  const allAssumptions: AnalysisResult['assumptions'] = [];

  let firstFailureTime = Infinity;
  let firstFailureNode: AnalysisResult['firstFailure'] | undefined;

  // Analyze each node against constraints
  nodes.forEach((node) => {
    const effectiveThroughput = node.config.throughput * node.config.scalingFactor;

    // Track assumptions for this node
    const nodeAssumptions = trackAssumptions(node, node.config.throughput, node.config.latency);
    allAssumptions.push(...nodeAssumptions);

    // Find upstream and downstream nodes
    const upstreamSources = findUpstreamSources(node.id, connections);
    const downstreamImpacts = findDownstreamImpacts(node.id, connections);

    // OPINIONATED ANALYSIS: Throughput capacity check
    if (effectiveThroughput < constraints.peakRPS) {
      const timeToFailure = calculateTimeToFailure(effectiveThroughput, constraints.peakRPS);
      const severity = effectiveThroughput < constraints.avgRPS ? 'high' : 'medium';

      // Track first failure
      if (timeToFailure < firstFailureTime) {
        firstFailureTime = timeToFailure;
        firstFailureNode = {
          nodeId: node.id,
          nodeName: node.config.name,
          timeToFailure,
          reason: `Cannot sustain peak load. Throughput capacity (${effectiveThroughput.toLocaleString()} rps) falls short of peak demand (${constraints.peakRPS.toLocaleString()} rps). Queue depth grows unbounded after ~${timeToFailure} seconds.`,
        };
      }

      bottlenecks.push({
        nodeId: node.id,
        nodeName: node.config.name,
        severity,
        reason: severity === 'high'
          ? `At peak load, this component cannot keep up. Throughput capacity (${effectiveThroughput.toLocaleString()} rps) is below peak demand (${constraints.peakRPS.toLocaleString()} rps). Queue depth grows unbounded after ~${timeToFailure} seconds. System fails.`
          : `Throughput capacity (${effectiveThroughput.toLocaleString()} rps) is below peak load (${constraints.peakRPS.toLocaleString()} rps). Component saturates under burst traffic. Latency degrades after ~${timeToFailure} seconds.`,
        timeToFailure,
        upstreamSources,
        downstreamImpacts,
      });

      suggestions.push({
        id: `scale-${node.id}`,
        title: `Scale ${node.config.name} to ${Math.ceil(constraints.peakRPS / node.config.throughput)}x`,
        why: `Current capacity (${effectiveThroughput.toLocaleString()} rps) cannot sustain peak load. Scaling to ${Math.ceil(constraints.peakRPS / node.config.throughput)}x provides necessary headroom.`,
        tradeoff: 'Increased infrastructure cost. Additional operational complexity.',
        impact: 'high',
      });
    }

    // OPINIONATED ANALYSIS: Latency violations
    if (node.config.latency > constraints.slaLatency) {
      const violationPercent = Math.round(((node.config.latency - constraints.slaLatency) / constraints.slaLatency) * 100);

      warnings.push({
        type: 'latency-violation',
        message: `${node.config.name} p95 latency (${node.config.latency}ms) exceeds SLA target (${constraints.slaLatency}ms) by ${violationPercent}%. End-to-end latency will breach requirements. ${Math.round((node.config.latency / constraints.slaLatency) * 100)}% of requests violate SLA.`,
      });

      // Suggest caching for high-latency databases
      if (node.type === 'postgresql' || node.type === 'mongodb') {
        const hasRedis = nodes.some((n) => n.type === 'redis');
        if (!hasRedis && constraints.readWriteRatio > 70) {
          suggestions.push({
            id: `cache-${node.id}`,
            title: 'Add Redis caching layer',
            why: `Read-heavy workload (${constraints.readWriteRatio}% reads) with database latency at ${node.config.latency}ms. Cache hit reduces p95 to sub-millisecond, eliminating ${violationPercent}% of SLA violations.`,
            tradeoff: 'Cache invalidation complexity. Eventual consistency window of 100-500ms.',
            impact: 'high',
          });
        }
      }
    }
  });

  // OPINIONATED ANALYSIS: Synchronous chain latency
  const syncChains = findSyncChains(nodes, connections);
  syncChains.forEach((chain) => {
    const totalLatency = chain.reduce((sum, nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      return sum + (node?.config.latency || 0);
    }, 0);

    if (totalLatency > constraints.slaLatency) {
      const chainNames = chain
        .map(id => nodes.find(n => n.id === id)?.config.name)
        .filter(Boolean)
        .join(' → ');

      warnings.push({
        type: 'latency-violation',
        message: `Synchronous chain (${chainNames}) accumulates ${totalLatency}ms latency, exceeding SLA (${constraints.slaLatency}ms). Every request in this path fails SLA. Break the chain with async boundaries.`,
      });

      const hasQueue = nodes.some((n) => n.type === 'kafka' || n.type === 'rabbitmq' || n.type === 'bullmq');
      if (!hasQueue) {
        suggestions.push({
          id: 'async-boundary',
          title: 'Introduce async message queue',
          why: 'Synchronous dependency chain blocks user-facing requests. Async boundary allows non-critical operations to be deferred, reducing user-facing latency to sub-${constraints.slaLatency}ms.',
          tradeoff: 'Eventual consistency. Increased system complexity. Requires idempotent consumers.',
          impact: 'high',
        });
      }
    }
  });

  // OPINIONATED ANALYSIS: Queue consumer throughput
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
      const deficit = producerRate - consumerRate;
      const timeToFailure = calculateTimeToFailure(consumerRate, producerRate, 10000); // Assume 10K message buffer

      warnings.push({
        type: 'queue-growth',
        message: `${queue.config.name} consumer group cannot keep up. Producer rate (${producerRate.toLocaleString()} rps) exceeds consumer capacity (${consumerRate.toLocaleString()} rps) by ${deficit.toLocaleString()} rps. Lag grows unbounded after ~${timeToFailure} seconds. Messages pile up at ${deficit.toLocaleString()} msg/sec.`,
        timeToFailure,
      });

      const requiredScaling = Math.ceil(producerRate / (consumers[0]?.config.throughput || 1));
      suggestions.push({
        id: `consumer-${queue.id}`,
        title: `Scale ${queue.config.name} consumers to ${requiredScaling}x`,
        why: `Producer rate (${producerRate.toLocaleString()} rps) exceeds consumer capacity. Scaling to ${requiredScaling}x eliminates lag growth and maintains ${constraints.consumerLagTolerance}ms lag tolerance.`,
        tradeoff: 'Increased compute cost. Potential out-of-order processing if not using partition keys.',
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
    analysis: {
      verdict,
      firstFailure: firstFailureNode,
      bottlenecks,
      warnings,
      assumptions: allAssumptions,
    },
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
