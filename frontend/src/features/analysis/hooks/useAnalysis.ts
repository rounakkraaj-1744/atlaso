import { useQuery } from '@tanstack/react-query';
import { analyzeSystem } from '../engine/analyzer';
import { useArchitectureStore } from '../../architecture/store';
import { useConstraintsStore } from '../../constraints/store';

export function useAnalysis() {
    const nodes = useArchitectureStore((state) => state.nodes);
    const connections = useArchitectureStore((state) => state.connections);
    const constraints = useConstraintsStore((state) => state.constraints);

    return useQuery({
        queryKey: ['analysis', nodes, connections, constraints],
        queryFn: () => analyzeSystem(nodes, connections, constraints),
        enabled: nodes.length > 0,
    });
}