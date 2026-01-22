import { create } from 'zustand';
import type { SystemConstraints, ScenarioPreset } from '../../types';

interface ConstraintsState {
    // Current constraints
    constraints: SystemConstraints;

    // Scenario state
    activeScenario: ScenarioPreset | 'custom';

    // Actions
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
            activeScenario: 'custom', // Switch to custom when manually editing
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
