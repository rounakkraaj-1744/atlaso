/**
 * Latency Rules - SLA compliance and latency budget analysis
 */

import type { Severity } from '../types';

export interface LatencyViolation {
    path: string[];
    totalLatencyMs: number;
    slaLatencyMs: number;
    violationMs: number;
    severity: Severity;
}

/**
 * Check if path violates latency SLA
 */
export function checkLatencyViolation(
    path: string[],
    latencies: number[],
    slaLatencyMs: number,
): LatencyViolation | null {
    const totalLatency = latencies.reduce((sum, l) => sum + l, 0);

    if (totalLatency <= slaLatencyMs) return null;

    const violationMs = totalLatency - slaLatencyMs;
    const violationPercent = (violationMs / slaLatencyMs) * 100;

    let severity: Severity;
    if (violationPercent > 100) {
        severity = 'critical';
    } else if (violationPercent > 50) {
        severity = 'high';
    } else if (violationPercent > 20) {
        severity = 'medium';
    } else {
        severity = 'low';
    }

    return {
        path,
        totalLatencyMs: totalLatency,
        slaLatencyMs,
        violationMs,
        severity,
    };
}

/**
 * Calculate latency budget per hop
 */
export function latencyBudgetPerHop(
    slaLatencyMs: number,
    hopCount: number,
    reservedPercent = 20,
): number {
    const usableBudget = slaLatencyMs * (1 - reservedPercent / 100);
    return Math.floor(usableBudget / hopCount);
}

/**
 * Check if node exceeds latency budget
 */
export function exceedsLatencyBudget(
    nodeLatency: number,
    budgetMs: number,
): boolean {
    return nodeLatency > budgetMs;
}
