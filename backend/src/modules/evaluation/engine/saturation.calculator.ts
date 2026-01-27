/**
 * Saturation Calculator
 * Calculates resource saturation and queue growth metrics
 */

import type {
    CanvasNode,
    Connection,
    SystemConstraints,
    WarningInfo,
} from '../../../shared/types';

/**
 * Calculate time to resource exhaustion
 */
export function calculateTimeToExhaustion(
    currentRate: number,
    maxCapacity: number,
    bufferSize: number,
): number {
    const deficit = currentRate - maxCapacity;
    if (deficit <= 0) return Infinity;
    return Math.round(bufferSize / deficit);
}

/**
 * Detect queue growth warnings
 */
export function detectQueueGrowth(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
): WarningInfo[] {
    const warnings: WarningInfo[] = [];
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
            const timeToFailure = calculateTimeToExhaustion(producerRate, consumerRate, 10000);

            warnings.push({
                type: 'queue-growth',
                message: `${queue.config.name} consumer group cannot keep up. Producer rate (${producerRate.toLocaleString()} rps) exceeds consumer capacity (${consumerRate.toLocaleString()} rps) by ${deficit.toLocaleString()} rps. Lag grows unbounded after ~${timeToFailure} seconds.`,
                timeToFailure,
            });
        }
    });

    return warnings;
}

/**
 * Detect resource exhaustion warnings
 */
export function detectResourceExhaustion(
    nodes: CanvasNode[],
    constraints: SystemConstraints,
): WarningInfo[] {
    const warnings: WarningInfo[] = [];

    nodes.forEach((node) => {
        const effectiveThroughput = node.config.throughput * node.config.scalingFactor;

        // Check if component will be at > 80% capacity
        const utilizationPercent = Math.round((constraints.peakRPS / effectiveThroughput) * 100);

        if (utilizationPercent > 90 && utilizationPercent <= 100) {
            warnings.push({
                type: 'resource-exhaustion',
                message: `${node.config.name} will operate at ${utilizationPercent}% capacity under peak load. No headroom for traffic spikes. Risk of cascading failure if load exceeds projections by >10%.`,
            });
        }
    });

    return warnings;
}

/**
 * Calculate saturation point (seconds until system saturates)
 */
export function calculateSaturationPoint(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
): number | null {
    let minTimeToSaturation = Infinity;

    nodes.forEach((node) => {
        const effectiveThroughput = node.config.throughput * node.config.scalingFactor;

        if (effectiveThroughput < constraints.peakRPS) {
            const deficit = constraints.peakRPS - effectiveThroughput;
            const timeToSaturation = Math.round(1000 / deficit); // Assuming 1000 message buffer
            minTimeToSaturation = Math.min(minTimeToSaturation, timeToSaturation);
        }
    });

    return minTimeToSaturation === Infinity ? null : minTimeToSaturation;
}
