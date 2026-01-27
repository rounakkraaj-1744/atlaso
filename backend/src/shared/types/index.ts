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
export type ScenarioPresetType = 'normal' | 'flash-sale' | 'black-friday' | 'incident' | 'custom';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Verdict = 'pass' | 'risky' | 'fail';
export interface NodeConfig {
    name: string;
    throughput: number;
    latency: number;
    scalingFactor: number;
    failureBehavior: string;
    notes: string;
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
    config: NodeConfig;
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

export interface FailurePropagationPath {
    nodeIds: string[];
    severity: Severity;
    timeToFailure: number;
}

export interface BottleneckInfo {
    nodeId: string;
    nodeName: string;
    severity: Severity;
    reason: string;
    timeToFailure?: number;
    upstreamSources?: string[];
    downstreamImpacts?: string[];
}

export interface WarningInfo {
    type: 'queue-growth' | 'latency-violation' | 'resource-exhaustion';
    message: string;
    timeToFailure?: number;
}

export interface AssumptionInfo {
    nodeId: string;
    nodeName: string;
    field: string;
    value: number | string;
    source: AssumptionSource;
    impact: Severity;
    explanation: string;
}

export interface FirstFailureInfo {
    nodeId: string;
    nodeName: string;
    timeToFailure: number;
    reason: string;
}

export interface AnalysisResult {
    verdict: Verdict;
    firstFailure?: FirstFailureInfo;
    bottlenecks: BottleneckInfo[];
    warnings: WarningInfo[];
    failurePropagationPaths?: FailurePropagationPath[];
    assumptions: AssumptionInfo[];
}

export interface Suggestion {
    id: string;
    title: string;
    why: string;
    tradeoff: string;
    impact: Severity;
}

export const PrismaVerdictMap = {
    pass: 'PASS',
    risky: 'RISKY',
    fail: 'FAIL',
} as const;

export const PrismaSeverityMap = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL',
} as const;