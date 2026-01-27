import type { GraphNode } from './node.model';
import type { GraphEdge } from './edge.model';
export interface Graph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, GraphEdge>;
    adjacencyList: Map<string, string[]>;
    reverseAdjacencyList: Map<string, string[]>;
}

// create a graph from nodes and edges
export function createGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph {
    const graph: Graph = {
        nodes: new Map(),
        edges: new Map(),
        adjacencyList: new Map(),
        reverseAdjacencyList: new Map(),
    };

    // add nodes
    nodes.forEach((node) => {
        graph.nodes.set(node.id, node);
        graph.adjacencyList.set(node.id, []);
        graph.reverseAdjacencyList.set(node.id, []);
    });

    // add edges and build adjacency lists
    edges.forEach((edge) => {
        graph.edges.set(edge.id, edge);

        const outgoing = graph.adjacencyList.get(edge.sourceId);
        if (outgoing)
            outgoing.push(edge.targetId);

        const incoming = graph.reverseAdjacencyList.get(edge.targetId);
        if (incoming)
            incoming.push(edge.sourceId);
    });

    return graph;
}

// get outgoing neighbors of a node
export function getOutgoing(graph: Graph, nodeId: string): string[] {
    return graph.adjacencyList.get(nodeId) || [];
}

// get incoming neighbors of a node
export function getIncoming(graph: Graph, nodeId: string): string[] {
    return graph.reverseAdjacencyList.get(nodeId) || [];
}

// get all edges from a node
export function getOutgoingEdges(graph: Graph, nodeId: string): GraphEdge[] {
    return Array.from(graph.edges.values()).filter((e) => e.sourceId === nodeId);
}

// get all edges to a node
export function getIncomingEdges(graph: Graph, nodeId: string): GraphEdge[] {
    return Array.from(graph.edges.values()).filter((e) => e.targetId === nodeId);
}

// find nodes with no incoming edges
export function findEntryPoints(graph: Graph): string[] {
    return Array.from(graph.nodes.keys()).filter(
        (nodeId) => (graph.reverseAdjacencyList.get(nodeId) || []).length === 0,
    );
}

// find nodes with no outgoing edges
export function findExitPoints(graph: Graph): string[] {
    return Array.from(graph.nodes.keys()).filter(
        (nodeId) => (graph.adjacencyList.get(nodeId) || []).length === 0,
    );
}