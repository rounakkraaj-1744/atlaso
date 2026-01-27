/**
 * Throughput Rules - Capacity analysis rules
 */

import type { Severity } from '../types';

export interface ThroughputViolation {
    nodeId: string;
    currentCapacity: number;
    requiredCapacity: number;
    deficit: number;
    severity: Severity;
}

/**
 * Check if node violates throughput requirements
 */
export function checkThroughputViolation(
    nodeId: string,
    currentCapacity: number,
    avgLoad: number,
    peakLoad: number,
): ThroughputViolation | null {
    if (currentCapacity >= peakLoad) return null;

    const deficit = peakLoad - currentCapacity;
    let severity: Severity;

    if (currentCapacity < avgLoad) {
        severity = 'critical';
    } else if (currentCapacity < peakLoad * 0.7) {
        severity = 'high';
    } else if (currentCapacity < peakLoad * 0.9) {
        severity = 'medium';
    } else {
        severity = 'low';
    }

    return {
        nodeId,
        currentCapacity,
        requiredCapacity: peakLoad,
        deficit,
        severity,
    };
}

/**
 * Calculate required scaling factor
 */
export function requiredScalingFactor(
    baseThroughput: number,
    targetThroughput: number,
    headroomPercent = 20,
): number {
    const withHeadroom = targetThroughput * (1 + headroomPercent / 100);
    return Math.ceil(withHeadroom / baseThroughput);
}
