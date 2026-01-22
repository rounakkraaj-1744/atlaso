import type { ScenarioDefinition, SystemConstraints } from '../../../types';

export const scenarioPresets: Record<string, ScenarioDefinition> = {
    normal: {
        name: 'Normal Traffic',
        description: 'Typical daily load with standard headroom',
        constraints: {
            avgRPS: 1000,
            peakRPS: 2000,
            readWriteRatio: 80,
            payloadSize: 10,
            slaLatency: 100,
            retryAttempts: 3,
            rateLimitRPS: 10000,
            consumerLagTolerance: 30,
        },
    },
    'flash-sale': {
        name: 'Flash Sale',
        description: 'Short-duration traffic spike (5-10x normal)',
        constraints: {
            avgRPS: 5000,
            peakRPS: 15000,
            readWriteRatio: 90, // Read-heavy during flash sales
            payloadSize: 10,
            slaLatency: 100,
            retryAttempts: 3,
            rateLimitRPS: 20000,
            consumerLagTolerance: 60,
        },
    },
    'black-friday': {
        name: 'Black Friday',
        description: 'Sustained extreme load (10-50x normal)',
        constraints: {
            avgRPS: 10000,
            peakRPS: 50000,
            readWriteRatio: 85,
            payloadSize: 12,
            slaLatency: 150, // Relaxed SLA during peak events
            retryAttempts: 5,
            rateLimitRPS: 60000,
            consumerLagTolerance: 120,
        },
    },
    incident: {
        name: 'Incident / Partial Outage',
        description: 'Reduced capacity (50% infrastructure available)',
        constraints: {
            avgRPS: 1000,
            peakRPS: 2000,
            readWriteRatio: 80,
            payloadSize: 10,
            slaLatency: 200, // Degraded performance acceptable
            retryAttempts: 5, // More retries during incidents
            rateLimitRPS: 5000, // Reduced capacity
            consumerLagTolerance: 60,
        },
    },
};

export const defaultConstraints: SystemConstraints = scenarioPresets.normal.constraints;
