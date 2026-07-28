import { create } from 'zustand';
import type { SystemConstraints, ScenarioPreset } from '../../types';

interface ConstraintsState {
    constraints: SystemConstraints;
    activeScenario: ScenarioPreset | 'custom';
    updateConstraints: (updates: Partial<SystemConstraints>) => void;
    setScenario: (scenario: ScenarioPreset, constraints: SystemConstraints) => void;
    resetConstraints: () => void;
}

const defaultConstraints: SystemConstraints = {
    avgRPS: 1000,
    peakRPS: 2000,
    readWriteRatio: 80,
    payloadSize: 10,
    slaLatency: 200,
    retryAttempts: 3,
    rateLimitRPS: 10000,
    consumerLagTolerance: 5000,
};

export const useConstraintsStore = create<ConstraintsState>((set) => ({
    constraints: defaultConstraints,
    activeScenario: 'normal',

    updateConstraints: (updates) =>
        set((state) => ({
            constraints: { ...state.constraints, ...updates },
            activeScenario: 'custom',
        })),

    setScenario: (scenario, constraints) =>
        set({
            activeScenario: scenario,
            constraints,
        }),

    resetConstraints: () =>
        set({
            constraints: defaultConstraints,
            activeScenario: 'normal',
        }),
}));