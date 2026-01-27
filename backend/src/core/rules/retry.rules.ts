import type { Severity } from '../types';

export interface RetryAmplification {
    originalLoad: number;
    amplifiedLoad: number;
    amplificationFactor: number;
    severity: Severity;
}

// calculate retry amplification factor
export function calculateRetryAmplification( retryAttempts: number, failureRate: number, ): number {
    // Geometric series: 1 + p + p^2 + ... + p^n
    // Where p = failure rate
    let total = 1;
    let probability = failureRate;

    for (let i = 0; i < retryAttempts; i++) {
        total += probability;
        probability *= failureRate;
    }

    return total;
}

// analyze retry storm risk
export function analyzeRetryStorm( baseLoad: number, retryAttempts: number, partialFailureRate: number, ): RetryAmplification {
    const factor = calculateRetryAmplification(retryAttempts, partialFailureRate);
    const amplifiedLoad = Math.round(baseLoad * factor);

    let severity: Severity;
    if (factor > 3)
        severity = 'critical';
    else if (factor > 2)
        severity = 'high';
    else if (factor > 1.5)
        severity = 'medium';
    else
        severity = 'low';

    return {
        originalLoad: baseLoad,
        amplifiedLoad,
        amplificationFactor: factor,
        severity,
    };
}

// calculate safe retry configuration
export function safeRetryConfig( maxAmplification: number, expectedFailureRate: number ): { maxRetries: number; backoffMs: number } {
    let retries = 0;
    let factor = 1;

    while (factor < maxAmplification && retries < 10) {
        retries++;
        factor = calculateRetryAmplification(retries, expectedFailureRate);
    }

    const backoffMs = 100 * Math.pow(2, Math.max(0, retries - 3));

    return {
        maxRetries: Math.max(0, retries - 1),
        backoffMs: Math.min(backoffMs, 30000),
    };
}