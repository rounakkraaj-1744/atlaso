import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useScenarioPresets() {
    return useQuery({
        queryKey: ['scenarioPresets'],
        queryFn: () => api.getScenarioPresets(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
