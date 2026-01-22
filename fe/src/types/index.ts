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

export type AssumptionSource = 'default' | 'user-provided' | 'heuristic';

export type VisualPriority = 'critical' | 'normal' | 'background';

export type ScenarioPreset = 'normal' | 'flash-sale' | 'black-friday' | 'incident';

export interface ComponentDefinition {
    type: ComponentType;
    category: ComponentCategory;
    name: string;
    description: string;
    defaultThroughput: number;
    defaultLatency: number;
}

export interface ConfigAssumptions {
    throughput: AssumptionSource;
    latency: AssumptionSource;
    scalingFactor: AssumptionSource;
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
    assumptions?: ConfigAssumptions;
    status: 'healthy' | 'warning' | 'bottleneck' | 'overloaded';
    visualPriority?: VisualPriority;
}

export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    hasRetry: boolean;
    hasBuffer: boolean;
    visualPriority?: VisualPriority;
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

export interface ScenarioDefinition {
    name: string;
    description: string;
    constraints: SystemConstraints;
}

export interface FailurePropagationPath {
    nodeIds: string[];
    severity: 'high' | 'medium' | 'low';
    timeToFailure: number; // seconds
}

export interface AnalysisResult {
    verdict: 'pass' | 'risky' | 'fail';
    firstFailure?: {
        nodeId: string;
        nodeName: string;
        timeToFailure: number; // seconds
        reason: string;
    };
    bottlenecks: Array<{
        nodeId: string;
        nodeName: string;
        severity: 'high' | 'medium' | 'low';
        reason: string;
        timeToFailure?: number; // seconds
        upstreamSources?: string[]; // node IDs
        downstreamImpacts?: string[]; // node IDs
    }>;
    warnings: Array<{
        type: 'queue-growth' | 'latency-violation' | 'resource-exhaustion';
        message: string;
        timeToFailure?: number; // seconds
    }>;
    failurePropagationPaths?: FailurePropagationPath[];
    assumptions: Array<{
        nodeId: string;
        nodeName: string;
        field: string;
        value: number | string;
        source: AssumptionSource;
        impact: 'high' | 'medium' | 'low';
        explanation: string;
    }>;
}

export interface Suggestion {
    id: string;
    title: string;
    why: string;
    tradeoff: string;
    impact: 'high' | 'medium' | 'low';
}

export interface ArchitectureSnapshot {
    id: string;
    name: string;
    timestamp: number;
    nodes: CanvasNode[];
    connections: Connection[];
    constraints: SystemConstraints;
    analysis?: AnalysisResult;
}

export interface ArchitectureComparison {
    before: ArchitectureSnapshot;
    after: ArchitectureSnapshot;
    diff: {
        addedNodes: string[];
        removedNodes: string[];
        modifiedNodes: string[];
        addedConnections: string[];
        removedConnections: string[];
    };
    metrics: {
        bottlenecksBefore: number;
        bottlenecksAfter: number;
        latencyBefore: number;
        latencyAfter: number;
        verdictBefore: 'pass' | 'risky' | 'fail';
        verdictAfter: 'pass' | 'risky' | 'fail';
    };
}
