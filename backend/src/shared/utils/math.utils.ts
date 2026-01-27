/**
 * Math Utilities - Common mathematical functions for analysis
 */

/**
 * Calculate time to failure in seconds based on throughput deficit
 */
export function calculateTimeToFailure(
    currentThroughput: number,
    requiredThroughput: number,
    bufferCapacity = 1000,
): number {
    const deficit = requiredThroughput - currentThroughput;
    if (deficit <= 0) return Infinity;
    return Math.round(bufferCapacity / deficit);
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Calculate utilization percentage
 */
export function utilizationPercent(current: number, max: number): number {
    if (max === 0) return 0;
    return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Calculate exponential backoff delay
 */
export function exponentialBackoff(
    attempt: number,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
): number {
    const delay = baseDelayMs * Math.pow(2, attempt);
    return Math.min(delay, maxDelayMs);
}

/**
 * Calculate moving average
 */
export function movingAverage(values: number[], window: number): number {
    if (values.length === 0) return 0;
    const slice = values.slice(-window);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}

/**
 * Calculate p95 from an array of values
 */
export function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

/**
 * Format number with locale separators
 */
export function formatNumber(value: number): string {
    return value.toLocaleString();
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${roundTo(bytes / Math.pow(k, i), 2)} ${sizes[i]}`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${roundTo(seconds / 3600, 1)}h`;
    return `${roundTo(seconds / 86400, 1)}d`;
}
