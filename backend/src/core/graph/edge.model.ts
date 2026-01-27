import type { ConnectionType, VisualPriority } from '../types';
export interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    hasRetry: boolean;
    hasBuffer: boolean;
    visualPriority?: VisualPriority;
}

//create a new graph edge
export function createEdge( id: string, sourceId: string, targetId: string, type: ConnectionType = 'sync', options?: { hasRetry?: boolean; hasBuffer?: boolean } ): GraphEdge {
    return {
        id,
        sourceId,
        targetId,
        type,
        hasRetry: options?.hasRetry ?? false,
        hasBuffer: options?.hasBuffer ?? false,
    };
}

// check synchronous edges
export function isSyncEdge (edge: GraphEdge): boolean {
    return edge.type === 'sync';
}

// check asynchronous edges
export function isAsyncEdge (edge: GraphEdge): boolean {
    return edge.type === 'async';
}
// check for fault tolerance in edge
export function hasFaultTolerance (edge: GraphEdge): boolean {
    return edge.hasRetry || edge.hasBuffer;
}