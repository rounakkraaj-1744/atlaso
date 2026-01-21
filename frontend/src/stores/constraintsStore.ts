import { create } from 'zustand';
import { SystemConstraints } from '../types';

interface ConstraintsStore {
    constraints: SystemConstraints;
    updateConstraints: (updates: Partial<SystemConstraints>) => void;
    resetConstraints: () => void;
}

const DEFAULT_CONSTRAINTS: SystemConstraints = {
    avgRps: 1000,
    peakRps: 5000,
    readWriteRatio: 80,
    payloadSizeKb: 1,
    slaP95Ms: 200,
    retryPolicy: {
        maxRetries: 3,
        timeoutMs: 5000,
    },
    consumerLagToleranceMs: 30000,
};

export const useConstraintsStore = create<ConstraintsStore>((set) => ({
    constraints: DEFAULT_CONSTRAINTS,

    updateConstraints: (updates) =>
        set((state) => ({
            constraints: { ...state.constraints, ...updates },
        })),

    resetConstraints: () =>
        set({ constraints: DEFAULT_CONSTRAINTS }),
}));
