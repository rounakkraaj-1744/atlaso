
import type { ComponentType, NodeConfig, VisualPriority } from '../types';

export interface NodePosition {
    x: number;
    y: number;
}
export interface GraphNode {
    id: string;
    type: ComponentType;
    position: NodePosition;
    config: NodeConfig;
    status: 'healthy' | 'warning' | 'bottleneck' | 'overloaded';
    visualPriority?: VisualPriority;
}

// create a new graph node
export function createNode( id: string, type: ComponentType, position: NodePosition, config: Partial<NodeConfig> ): GraphNode {
    return {
        id,
        type,
        position,
        config: {
            name: config.name || type,
            throughput: config.throughput || 1000,
            latency: config.latency || 50,
            scalingFactor: config.scalingFactor || 1,
            failureBehavior: config.failureBehavior || 'fail-fast',
            notes: config.notes || '',
        },
        status: 'healthy',
    };
}

// calculate effective throughput of a node
export function getEffectiveThroughput(node: GraphNode): number {
    return node.config.throughput * node.config.scalingFactor;
}

// check if node is a queue type
export function isQueueNode(node: GraphNode): boolean {
    return ['kafka', 'rabbitmq', 'bullmq'].includes(node.type);
}
 // check node is a db type
export function isDatabaseNode(node: GraphNode): boolean {
    return ['postgresql', 'mongodb', 'redis'].includes(node.type);
}
 // check node is a compute type
export function isComputeNode(node: GraphNode): boolean {
    return ['api-server', 'worker', 'cron-job'].includes(node.type);
}