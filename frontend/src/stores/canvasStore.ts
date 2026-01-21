import { create } from 'zustand';
import { ArchitectureNode, ArchitectureEdge } from '../types';

interface CanvasStore {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    selectedNodeId: string | null;

    addNode: (node: ArchitectureNode) => void;
    updateNode: (id: string, updates: Partial<ArchitectureNode>) => void;
    removeNode: (id: string) => void;

    addEdge: (edge: ArchitectureEdge) => void;
    removeEdge: (id: string) => void;

    setSelectedNode: (id: string | null) => void;

    clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    addNode: (node) =>
        set((state) => ({ nodes: [...state.nodes, node] })),

    updateNode: (id, updates) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, ...updates } : node
            ),
        })),

    removeNode: (id) =>
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),

    addEdge: (edge) =>
        set((state) => ({ edges: [...state.edges, edge] })),

    removeEdge: (id) =>
        set((state) => ({
            edges: state.edges.filter((edge) => edge.id !== id),
        })),

    setSelectedNode: (id) =>
        set({ selectedNodeId: id }),

    clearCanvas: () =>
        set({ nodes: [], edges: [], selectedNodeId: null }),
}));
