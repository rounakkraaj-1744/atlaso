/**
 * Queue Heuristics - General message queue patterns
 */

export interface QueueHeuristic {
    type: string;
    defaultBufferSize: number;
    typicalLatencyMs: number;
    maxThroughputPerInstance: number;
}

export const queueHeuristics: Record<string, QueueHeuristic> = {
    rabbitmq: {
        type: 'rabbitmq',
        defaultBufferSize: 10000,
        typicalLatencyMs: 3,
        maxThroughputPerInstance: 20000,
    },
    bullmq: {
        type: 'bullmq',
        defaultBufferSize: 5000,
        typicalLatencyMs: 2,
        maxThroughputPerInstance: 5000,
    },
};

/**
 * Calculate time to queue overflow
 */
export function timeToOverflow(
    producerRate: number,
    consumerRate: number,
    bufferSize: number,
): number {
    const deficit = producerRate - consumerRate;
    if (deficit <= 0) return Infinity;
    return Math.round(bufferSize / deficit);
}

/**
 * Calculate required consumers for target throughput
 */
export function requiredConsumers(
    targetRPS: number,
    consumerThroughput: number,
    overheadPercent = 20,
): number {
    const withOverhead = targetRPS * (1 + overheadPercent / 100);
    return Math.ceil(withOverhead / consumerThroughput);
}

/**
 * Estimate message age in queue
 */
export function estimateMessageAge(
    queueDepth: number,
    consumerRate: number,
): number {
    if (consumerRate === 0) return Infinity;
    return queueDepth / consumerRate;
}
