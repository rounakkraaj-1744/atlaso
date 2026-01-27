/**
 * Edge Model - Graph edge representation for connections
 */

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

/**
 * Create a new graph edge
 */
export function createEdge(
    id: string,
    sourceId: string,
    targetId: string,
    type: ConnectionType = 'sync',
    options?: { hasRetry?: boolean; hasBuffer?: boolean },
): GraphEdge {
    return {
        id,
        sourceId,
        targetId,
        type,
        hasRetry: options?.hasRetry ?? false,
        hasBuffer: options?.hasBuffer ?? false,
    };
}

/**
 * Check if edge is synchronous
 */
export function isSyncEdge(edge: GraphEdge): boolean {
    return edge.type === 'sync';
}

/**
 * Check if edge is asynchronous
 */
export function isAsyncEdge(edge: GraphEdge): boolean {
    return edge.type === 'async';
}

/**
 * Check if edge has fault tolerance
 */
export function hasFaultTolerance(edge: GraphEdge): boolean {
    return edge.hasRetry || edge.hasBuffer;
}
