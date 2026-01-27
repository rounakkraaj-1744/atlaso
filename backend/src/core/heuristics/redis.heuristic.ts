/**
 * Redis Heuristics - Caching and memory patterns
 */

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

/**
 * Estimate max keys that can be stored
 */
export function estimateMaxKeys(
    memoryMB: number,
    avgKeySizeBytes: number,
): number {
    const memoryBytes = memoryMB * 1024 * 1024;
    // Account for Redis overhead (~20%)
    const usableMemory = memoryBytes * 0.8;
    return Math.floor(usableMemory / avgKeySizeBytes);
}

/**
 * Calculate cache hit ratio impact on backend load
 */
export function backendLoadReduction(
    totalRPS: number,
    cacheHitRatio: number,
): number {
    return Math.round(totalRPS * (1 - cacheHitRatio));
}

/**
 * Estimate TTL for target hit ratio
 */
export function recommendedTTL(
    updateFrequencySec: number,
    targetHitRatio: number,
): number {
    // Higher TTL = higher hit ratio but more stale data
    return Math.round(updateFrequencySec * (1 / (1 - targetHitRatio)));
}

/**
 * Calculate effective throughput with cache
 */
export function effectiveThroughput(
    backendThroughput: number,
    cacheHitRatio: number,
    cacheThroughput: number,
): number {
    const backendLoad = 1 - cacheHitRatio;
    return Math.round(cacheThroughput * cacheHitRatio + backendThroughput * backendLoad);
}
