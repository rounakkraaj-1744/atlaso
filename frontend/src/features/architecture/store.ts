import { create } from 'zustand';
import type { CanvasNode, Connection } from '../../types';

interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

interface ArchitectureState {
    nodes: CanvasNode[];
    connections: Connection[];

    viewport: Viewport;
    selectedNodeId: string | null;
    selectedConnectionId: string | null;

    addNode: (node: CanvasNode) => void;
    updateNode: (id: string, updates: Partial<CanvasNode>) => void;
    deleteNode: (id: string) => void;
    duplicateNode: (id: string) => void;
    setNodePosition: (id: string, position: { x: number; y: number }) => void;
    addConnection: (connection: Connection) => void;
    updateConnection: (id: string, updates: Partial<Connection>) => void;
    deleteConnection: (id: string) => void;
    setViewport: (viewport: Partial<Viewport>) => void;
    setSelectedNode: (id: string | null) => void;
    setSelectedConnection: (id: string | null) => void;
    resetCanvas: () => void;
}

const initialState = {
    nodes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeId: null,
    selectedConnectionId: null,
};

export const useArchitectureStore = create<ArchitectureState>((set) => ({
    ...initialState,

    addNode: (node) =>
        set((state) => ({
            nodes: [...state.nodes, node],
        })),

    updateNode: (id, updates) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, ...updates } : node
            ),
        })),

    deleteNode: (id) =>
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            connections: state.connections.filter(
                (conn) => conn.from !== id && conn.to !== id
            ),
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),

    duplicateNode: (id) =>
        set((state) => {
            const nodeToDuplicate = state.nodes.find((node) => node.id === id);
            if (!nodeToDuplicate) return state;

            const newNode: CanvasNode = {
                ...nodeToDuplicate,
                id: `node_${Date.now()}`,
                position: {
                    x: nodeToDuplicate.position.x + 50,
                    y: nodeToDuplicate.position.y + 50,
                },
            };

            return {
                nodes: [...state.nodes, newNode],
            };
        }),

    setNodePosition: (id, position) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, position } : node
            ),
        })),

    addConnection: (connection) =>
        set((state) => ({
            connections: [...state.connections, connection],
        })),

    updateConnection: (id, updates) =>
        set((state) => ({
            connections: state.connections.map((conn) =>
                conn.id === id ? { ...conn, ...updates } : conn
            ),
        })),

    deleteConnection: (id) =>
        set((state) => ({
            connections: state.connections.filter((conn) => conn.id !== id),
            selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
        })),

    setViewport: (viewport) =>
        set((state) => ({
            viewport: { ...state.viewport, ...viewport },
        })),

    setSelectedNode: (id) =>
        set({ selectedNodeId: id, selectedConnectionId: null }),

    setSelectedConnection: (id) =>
        set({ selectedConnectionId: id, selectedNodeId: null }),

    resetCanvas: () => set(initialState),
}));