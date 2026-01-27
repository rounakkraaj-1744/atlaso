/**
 * Graph Traversal - BFS/DFS and path finding algorithms
 */

import type { Graph } from './graph.model';
import { getOutgoing, getIncoming } from './graph.model';

/**
 * Breadth-first search from a starting node
 */
export function bfs(
    graph: Graph,
    startNodeId: string,
    direction: 'forward' | 'backward' = 'forward',
): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;

        visited.add(nodeId);
        result.push(nodeId);

        const neighbors = direction === 'forward'
            ? getOutgoing(graph, nodeId)
            : getIncoming(graph, nodeId);

        neighbors.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        });
    }

    return result;
}

/**
 * Depth-first search from a starting node
 */
export function dfs(
    graph: Graph,
    startNodeId: string,
    direction: 'forward' | 'backward' = 'forward',
): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    function visit(nodeId: string): void {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        result.push(nodeId);

        const neighbors = direction === 'forward'
            ? getOutgoing(graph, nodeId)
            : getIncoming(graph, nodeId);

        neighbors.forEach((neighbor) => visit(neighbor));
    }

    visit(startNodeId);
    return result;
}

/**
 * Find all paths between two nodes
 */
export function findAllPaths(
    graph: Graph,
    startId: string,
    endId: string,
    maxDepth = 10,
): string[][] {
    const paths: string[][] = [];

    function dfsPath(current: string, path: string[], depth: number): void {
        if (depth > maxDepth) return;
        if (current === endId) {
            paths.push([...path]);
            return;
        }

        const neighbors = getOutgoing(graph, current);
        for (const neighbor of neighbors) {
            if (!path.includes(neighbor)) {
                path.push(neighbor);
                dfsPath(neighbor, path, depth + 1);
                path.pop();
            }
        }
    }

    dfsPath(startId, [startId], 0);
    return paths;
}

/**
 * Detect cycles in the graph
 */
export function detectCycles(graph: Graph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function dfsDetect(nodeId: string, path: string[]): void {
        if (recursionStack.has(nodeId)) {
            const cycleStart = path.indexOf(nodeId);
            if (cycleStart !== -1) {
                cycles.push(path.slice(cycleStart));
            }
            return;
        }
        if (visited.has(nodeId)) return;

        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        getOutgoing(graph, nodeId).forEach((neighbor) => {
            dfsDetect(neighbor, [...path]);
        });

        recursionStack.delete(nodeId);
    }

    for (const nodeId of graph.nodes.keys()) {
        if (!visited.has(nodeId)) {
            dfsDetect(nodeId, []);
        }
    }

    return cycles;
}

/**
 * Topological sort (returns null if cycles exist)
 */
export function topologicalSort(graph: Graph): string[] | null {
    const inDegree = new Map<string, number>();

    // Initialize in-degree
    for (const nodeId of graph.nodes.keys()) {
        inDegree.set(nodeId, 0);
    }

    // Calculate in-degrees
    for (const edge of graph.edges.values()) {
        const current = inDegree.get(edge.targetId) || 0;
        inDegree.set(edge.targetId, current + 1);
    }

    // Start with nodes having 0 in-degree
    const queue = Array.from(graph.nodes.keys()).filter(
        (id) => inDegree.get(id) === 0,
    );
    const result: string[] = [];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        result.push(nodeId);

        for (const neighbor of getOutgoing(graph, nodeId)) {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    return result.length === graph.nodes.size ? result : null;
}
