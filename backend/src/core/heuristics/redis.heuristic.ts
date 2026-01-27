export interface RedisHeuristic {
    maxMemoryMB: number;
    avgKeyValueSizeBytes: number;
    typicalP95LatencyMs: number;
    maxOpsPerSec: number;
}

export const redisHeuristics: RedisHeuristic = {
    maxMemoryMB: 1024,
    avgKeyValueSizeBytes: 1024,
    typicalP95LatencyMs: 1,
    maxOpsPerSec: 100000,
};

// number of max keys that can be stored
export function estimateMaxKeys( memoryMB: number, avgKeySizeBytes: number ): number {
    const memoryBytes = memoryMB * 1024 * 1024;
    const usableMemory = memoryBytes * 0.8;
    return Math.floor(usableMemory / avgKeySizeBytes);
}

// cache hit ratio impact on backend load
export function backendLoadReduction( totalRPS: number, cacheHitRatio: number ): number {
    return Math.round(totalRPS * (1 - cacheHitRatio));
}

export function recommendedTTL( updateFrequencySec: number, targetHitRatio: number ): number {
    // higher TTL = higher hit ratio but more stale data
    return Math.round(updateFrequencySec * (1 / (1 - targetHitRatio)));
}

// calculate effective throughput with cache
export function effectiveThroughput( backendThroughput: number, cacheHitRatio: number, cacheThroughput: number, ): number {
    const backendLoad = 1 - cacheHitRatio;
    return Math.round(cacheThroughput * cacheHitRatio + backendThroughput * backendLoad);
}