/**
 * Scenario Presets
 * Matches frontend scenario patterns
 */

import type { SystemConstraints } from '../../shared/types';

export interface ScenarioPreset {
    type: 'normal' | 'flash-sale' | 'black-friday' | 'incident';
    name: string;
    description: string;
    constraints: SystemConstraints;
}

export const scenarioPresets: ScenarioPreset[] = [
    {
        type: 'normal',
        name: 'Normal Operations',
        description: 'Standard day-to-day traffic patterns with moderate load.',
        constraints: {
            avgRPS: 1000,
            peakRPS: 2000,
            readWriteRatio: 80,
            payloadSize: 10,
            slaLatency: 200,
            retryAttempts: 3,
            rateLimitRPS: 10000,
            consumerLagTolerance: 5000,
        },
    },
    {
        type: 'flash-sale',
        name: 'Flash Sale',
        description: 'Short burst of high traffic from promotional events.',
        constraints: {
            avgRPS: 5000,
            peakRPS: 25000,
            readWriteRatio: 60,
            payloadSize: 15,
            slaLatency: 500,
            retryAttempts: 5,
            rateLimitRPS: 50000,
            consumerLagTolerance: 10000,
        },
    },
    {
        type: 'black-friday',
        name: 'Black Friday',
        description: 'Sustained extreme load during major shopping events.',
        constraints: {
            avgRPS: 10000,
            peakRPS: 50000,
            readWriteRatio: 50,
            payloadSize: 20,
            slaLatency: 1000,
            retryAttempts: 5,
            rateLimitRPS: 100000,
            consumerLagTolerance: 30000,
        },
    },
    {
        type: 'incident',
        name: 'Incident Recovery',
        description: 'System recovering from partial outage with backlog processing.',
        constraints: {
            avgRPS: 3000,
            peakRPS: 8000,
            readWriteRatio: 40,
            payloadSize: 10,
            slaLatency: 2000,
            retryAttempts: 10,
            rateLimitRPS: 20000,
            consumerLagTolerance: 60000,
        },
    },
];

export function getPresetByType(type: string): ScenarioPreset | undefined {
    return scenarioPresets.find((p) => p.type === type);
}
