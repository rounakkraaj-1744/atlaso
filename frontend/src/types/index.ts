export type ComponentCategory =
    | 'traffic'
    | 'compute'
    | 'messaging'
    | 'caching'
    | 'observability';

export type ComponentType =
    | 'load-balancer'
    | 'api-gateway'
    | 'cdn'
    | 'api-server'
    | 'worker'
    | 'cron-job'
    | 'kafka'
    | 'rabbitmq'
    | 'bullmq'
    | 'redis'
    | 'postgresql'
    | 'mongodb'
    | 'metrics'
    | 'logs'
    | 'tracing';

export type ConnectionType = 'sync' | 'async';

export interface ComponentDefinition {
    type: ComponentType;
    category: ComponentCategory;
    name: string;
    description: string;
    defaultThroughput: number;
    defaultLatency: number;
}

export interface CanvasNode {
    id: string;
    type: ComponentType;
    position: { x: number; y: number };
    config: {
        name: string;
        throughput: number;
        latency: number;
        scalingFactor: number;
        failureBehavior: string;
        notes: string;
    };
    status: 'healthy' | 'warning' | 'bottleneck' | 'overloaded';
}

export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    hasRetry: boolean;
    hasBuffer: boolean;
}

export interface SystemConstraints {
    avgRPS: number;
    peakRPS: number;
    readWriteRatio: number;
    payloadSize: number;
    slaLatency: number;
    retryAttempts: number;
    rateLimitRPS: number;
    consumerLagTolerance: number;
}

export interface AnalysisResult {
    verdict: 'pass' | 'risky' | 'fail';
    bottlenecks: Array<{
        nodeId: string;
        nodeName: string;
        severity: 'high' | 'medium' | 'low';
        reason: string;
    }>;
    warnings: Array<{
        type: 'queue-growth' | 'latency-violation' | 'resource-exhaustion';
        message: string;
    }>;
}

export interface Suggestion {
    id: string;
    title: string;
    why: string;
    tradeoff: string;
    impact: 'high' | 'medium' | 'low';
}
