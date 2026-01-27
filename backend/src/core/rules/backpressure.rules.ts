/**
 * Backpressure Rules - Load shedding and circuit breaker analysis
 */

import type { Severity } from '../types';

export interface BackpressureState {
    utilization: number;
    shouldShed: boolean;
    shedPercent: number;
    severity: Severity;
}

/**
 * Calculate backpressure state
 */
export function calculateBackpressure(
    currentLoad: number,
    maxCapacity: number,
    targetUtilization = 0.8,
): BackpressureState {
    const utilization = currentLoad / maxCapacity;
    const shouldShed = utilization > targetUtilization;

    let shedPercent = 0;
    let severity: Severity = 'low';

    if (utilization > 1.2) {
        severity = 'critical';
        shedPercent = Math.min(50, ((utilization - 1) * 100));
    } else if (utilization > 1.0) {
        severity = 'high';
        shedPercent = Math.min(30, ((utilization - 1) * 100));
    } else if (utilization > targetUtilization) {
        severity = 'medium';
        shedPercent = Math.min(20, ((utilization - targetUtilization) * 100));
    }

    return {
        utilization,
        shouldShed,
        shedPercent: Math.round(shedPercent),
        severity,
    };
}

/**
 * Check if circuit breaker should open
 */
export function shouldOpenCircuitBreaker(
    failureRate: number,
    thresholdRate = 0.5,
    minRequests = 10,
    totalRequests = 0,
): boolean {
    if (totalRequests < minRequests) return false;
    return failureRate >= thresholdRate;
}

/**
 * Calculate circuit breaker recovery timeout
 */
export function circuitBreakerTimeout(
    consecutiveFailures: number,
    baseTimeoutMs = 5000,
    maxTimeoutMs = 60000,
): number {
    const timeout = baseTimeoutMs * Math.pow(2, consecutiveFailures);
    return Math.min(timeout, maxTimeoutMs);
}

/**
 * Calculate effective capacity with backpressure
 */
export function effectiveCapacityWithBackpressure(
    maxCapacity: number,
    shedPercent: number,
): number {
    return Math.round(maxCapacity * (1 - shedPercent / 100));
}
