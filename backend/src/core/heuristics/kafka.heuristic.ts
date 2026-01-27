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

// calculate recommendPartitions for target throughput
export function recommendedPartitions(targetRPS: number): number {
    const partitions = Math.ceil(
        targetRPS / kafkaHeuristics.messagesPerPartitionPerSec,
    );
    // Round up to nearest power of 2 for even distribution
    return Math.pow(2, Math.ceil(Math.log2(Math.max(partitions, 1))));
}

// calculate consumer group throughput
export function consumerGroupThroughput( consumers: number, partitions: number, processingLatencyMs: number ): number {
    // each consumer can handle multiple partitions
    const activeConsumers = Math.min(consumers, partitions);
    const perConsumerTPS = 1000 / processingLatencyMs;
    return Math.floor(activeConsumers * perConsumerTPS);
}

 // calculation of consumer lag time
export function estimateLagTime( producerRate: number, consumerRate: number, currentLag: number ): number {
    if (consumerRate >= producerRate)
        return currentLag / consumerRate;
    return Infinity;
}