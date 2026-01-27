/**
 * Core Types - Re-export shared types for core module usage
 */

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

export type VisualPriority = 'critical' | 'normal' | 'background';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface NodeConfig {
    name: string;
    throughput: number;
    latency: number;
    scalingFactor: number;
    failureBehavior: string;
    notes: string;
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