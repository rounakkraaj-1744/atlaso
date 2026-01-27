/**
 * Kafka Heuristics - Partitioning and throughput patterns
 */

export interface KafkaHeuristic {
    defaultPartitions: number;
    messagesPerPartitionPerSec: number;
    replicationFactor: number;
    retentionHours: number;
}

export const kafkaHeuristics: KafkaHeuristic = {
    defaultPartitions: 12,
    messagesPerPartitionPerSec: 10000,
    replicationFactor: 3,
    retentionHours: 168, // 7 days
};

/**
 * Calculate recommended partitions for target throughput
 */
export function recommendedPartitions(targetRPS: number): number {
    const partitions = Math.ceil(
        targetRPS / kafkaHeuristics.messagesPerPartitionPerSec,
    );
    // Round up to nearest power of 2 for even distribution
    return Math.pow(2, Math.ceil(Math.log2(Math.max(partitions, 1))));
}

/**
 * Calculate consumer group throughput
 */
export function consumerGroupThroughput(
    consumers: number,
    partitions: number,
    processingLatencyMs: number,
): number {
    // Each consumer can handle multiple partitions
    const activeConsumers = Math.min(consumers, partitions);
    const perConsumerTPS = 1000 / processingLatencyMs;
    return Math.floor(activeConsumers * perConsumerTPS);
}

/**
 * Calculate consumer lag time
 */
export function estimateLagTime(
    producerRate: number,
    consumerRate: number,
    currentLag: number,
): number {
    if (consumerRate >= producerRate) {
        return currentLag / consumerRate;
    }
    // Lag grows unbounded
    return Infinity;
}
