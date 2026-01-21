import { create } from 'zustand';
import { AnalysisResult } from '../types';

interface AnalysisStore {
    result: AnalysisResult | null;
    isAnalyzing: boolean;

    setResult: (result: AnalysisResult) => void;
    setAnalyzing: (isAnalyzing: boolean) => void;
    clearResult: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
    result: null,
    isAnalyzing: false,

    setResult: (result) =>
        set({ result, isAnalyzing: false }),

    setAnalyzing: (isAnalyzing) =>
        set({ isAnalyzing }),

    clearResult: () =>
        set({ result: null }),
}));
