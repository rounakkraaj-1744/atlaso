/**
 * Propagation Engine
 * Finds sync chains and calculates failure propagation paths
 */

import type {
    CanvasNode,
    Connection,
    SystemConstraints,
    WarningInfo,
    FailurePropagationPath,
} from '../../../shared/types';

/**
 * Find synchronous call chains
 */
export function findSyncChains(
    nodes: CanvasNode[],
    connections: Connection[],
): string[][] {
    const syncConnections = connections.filter((c) => c.type === 'sync');
    const chains: string[][] = [];
    const visited = new Set<string>();

    // Build adjacency map
    const adjMap = new Map<string, string[]>();
    syncConnections.forEach((conn) => {
        if (!adjMap.has(conn.sourceId)) {
            adjMap.set(conn.sourceId, []);
        }
        adjMap.get(conn.sourceId)!.push(conn.targetId);
    });

    // DFS to find chains
    function dfs(nodeId: string, currentChain: string[]): void {
        currentChain.push(nodeId);
        visited.add(nodeId);

        const neighbors = adjMap.get(nodeId) || [];
        if (neighbors.length === 0) {
            // End of chain
            if (currentChain.length > 1) {
                chains.push([...currentChain]);
            }
        } else {
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, currentChain);
                }
            }
        }

        currentChain.pop();
        visited.delete(nodeId);
    }

    // Start DFS from each node that is a source but not a target
    const targetNodes = new Set(syncConnections.map((c) => c.targetId));
    const sourceNodes = new Set(syncConnections.map((c) => c.sourceId));
    const startNodes = [...sourceNodes].filter((n) => !targetNodes.has(n));

    startNodes.forEach((startNode) => {
        dfs(startNode, []);
    });

    return chains;
}

/**
 * Detect latency violations in sync chains
 */
export function detectChainLatencyViolations(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
): WarningInfo[] {
    const warnings: WarningInfo[] = [];
    const syncChains = findSyncChains(nodes, connections);

    syncChains.forEach((chain) => {
        const totalLatency = chain.reduce((sum, nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            return sum + (node?.config.latency || 0);
        }, 0);

        if (totalLatency > constraints.slaLatency) {
            const chainNames = chain
                .map((id) => nodes.find((n) => n.id === id)?.config.name)
                .filter(Boolean)
                .join(' → ');

            warnings.push({
                type: 'latency-violation',
                message: `Synchronous chain (${chainNames}) accumulates ${totalLatency}ms latency, exceeding SLA (${constraints.slaLatency}ms). Every request in this path fails SLA. Break the chain with async boundaries.`,
            });
        }
    });

    return warnings;
}

/**
 * Detect latency violations in individual nodes
 */
export function detectNodeLatencyViolations(
    nodes: CanvasNode[],
    constraints: SystemConstraints,
): WarningInfo[] {
    const warnings: WarningInfo[] = [];

    nodes.forEach((node) => {
        if (node.config.latency > constraints.slaLatency) {
            const violationPercent = Math.round(
                ((node.config.latency - constraints.slaLatency) / constraints.slaLatency) * 100,
            );

            warnings.push({
                type: 'latency-violation',
                message: `${node.config.name} p95 latency (${node.config.latency}ms) exceeds SLA target (${constraints.slaLatency}ms) by ${violationPercent}%. End-to-end latency will breach requirements.`,
            });
        }
    });

    return warnings;
}

/**
 * Build failure propagation paths
 */
export function buildFailurePropagationPaths(
    nodes: CanvasNode[],
    connections: Connection[],
    bottleneckNodeIds: string[],
): FailurePropagationPath[] {
    const paths: FailurePropagationPath[] = [];

    bottleneckNodeIds.forEach((bottleneckId) => {
        const visited = new Set<string>();
        const impactedNodes: string[] = [bottleneckId];

        // BFS to find downstream impacts
        const queue = [bottleneckId];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);

            const downstream = connections
                .filter((c) => c.sourceId === current)
                .map((c) => c.targetId);

            downstream.forEach((id) => {
                if (!visited.has(id)) {
                    impactedNodes.push(id);
                    queue.push(id);
                }
            });
        }

        if (impactedNodes.length > 1) {
            paths.push({
                nodeIds: impactedNodes,
                severity: impactedNodes.length > 3 ? 'high' : impactedNodes.length > 2 ? 'medium' : 'low',
                timeToFailure: 60, // Default estimate
            });
        }
    });

    return paths;
}
