/**
 * Bottleneck Detector
 * Detects throughput capacity issues and calculates failure timelines
 */

import type {
    CanvasNode,
    Connection,
    SystemConstraints,
    BottleneckInfo,
    Severity,
} from '../../../shared/types';

export interface BottleneckResult {
    bottlenecks: BottleneckInfo[];
    firstFailure?: {
        nodeId: string;
        nodeName: string;
        timeToFailure: number;
        reason: string;
    };
}

/**
 * Calculate time to failure in seconds based on throughput deficit
 */
function calculateTimeToFailure(
    currentThroughput: number,
    requiredThroughput: number,
    bufferCapacity = 1000,
): number {
    const deficit = requiredThroughput - currentThroughput;
    if (deficit <= 0) return Infinity;

    // Time = Buffer Capacity / Deficit Rate
    return Math.round(bufferCapacity / deficit);
}

/**
 * Find upstream sources for a given node
 */
function findUpstreamSources(nodeId: string, connections: Connection[]): string[] {
    return connections.filter((c) => c.targetId === nodeId).map((c) => c.sourceId);
}

/**
 * Find downstream impacts for a given node
 */
function findDownstreamImpacts(nodeId: string, connections: Connection[]): string[] {
    return connections.filter((c) => c.sourceId === nodeId).map((c) => c.targetId);
}

/**
 * Detect bottlenecks in the architecture
 */
export function detectBottlenecks(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
): BottleneckResult {
    const bottlenecks: BottleneckInfo[] = [];
    let firstFailureTime = Infinity;
    let firstFailure: BottleneckResult['firstFailure'];

    nodes.forEach((node) => {
        const effectiveThroughput = node.config.throughput * node.config.scalingFactor;
        const upstreamSources = findUpstreamSources(node.id, connections);
        const downstreamImpacts = findDownstreamImpacts(node.id, connections);

        // Throughput capacity check
        if (effectiveThroughput < constraints.peakRPS) {
            const timeToFailure = calculateTimeToFailure(
                effectiveThroughput,
                constraints.peakRPS,
            );
            const severity: Severity = effectiveThroughput < constraints.avgRPS ? 'high' : 'medium';

            // Track first failure
            if (timeToFailure < firstFailureTime) {
                firstFailureTime = timeToFailure;
                firstFailure = {
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
                reason:
                    severity === 'high'
                        ? `At peak load, this component cannot keep up. Throughput capacity (${effectiveThroughput.toLocaleString()} rps) is below peak demand (${constraints.peakRPS.toLocaleString()} rps). Queue depth grows unbounded after ~${timeToFailure} seconds. System fails.`
                        : `Throughput capacity (${effectiveThroughput.toLocaleString()} rps) is below peak load (${constraints.peakRPS.toLocaleString()} rps). Component saturates under burst traffic. Latency degrades after ~${timeToFailure} seconds.`,
                timeToFailure,
                upstreamSources,
                downstreamImpacts,
            });
        }
    });

    return {
        bottlenecks,
        firstFailure,
    };
}

/**
 * Detect queue consumer bottlenecks
 */
export function detectQueueBottlenecks(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
): BottleneckInfo[] {
    const bottlenecks: BottleneckInfo[] = [];
    const queueTypes = ['kafka', 'rabbitmq', 'bullmq'];

    const queueNodes = nodes.filter((n) => queueTypes.includes(n.type));

    queueNodes.forEach((queue) => {
        const producers = connections
            .filter((c) => c.targetId === queue.id)
            .map((c) => nodes.find((n) => n.id === c.sourceId))
            .filter(Boolean) as CanvasNode[];

        const consumers = connections
            .filter((c) => c.sourceId === queue.id)
            .map((c) => nodes.find((n) => n.id === c.targetId))
            .filter(Boolean) as CanvasNode[];

        const producerRate = producers.reduce(
            (sum, p) => sum + p.config.throughput * p.config.scalingFactor,
            0,
        );
        const consumerRate = consumers.reduce(
            (sum, c) => sum + c.config.throughput * c.config.scalingFactor,
            0,
        );

        if (consumerRate < producerRate) {
            const deficit = producerRate - consumerRate;
            const timeToFailure = calculateTimeToFailure(consumerRate, producerRate, 10000);

            bottlenecks.push({
                nodeId: queue.id,
                nodeName: queue.config.name,
                severity: 'high',
                reason: `Consumer group cannot keep up. Producer rate (${producerRate.toLocaleString()} rps) exceeds consumer capacity (${consumerRate.toLocaleString()} rps) by ${deficit.toLocaleString()} rps. Lag grows unbounded after ~${timeToFailure} seconds.`,
                timeToFailure,
                upstreamSources: producers.map((p) => p.id),
                downstreamImpacts: consumers.map((c) => c.id),
            });
        }
    });

    return bottlenecks;
}
