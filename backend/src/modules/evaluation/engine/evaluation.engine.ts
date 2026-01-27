/**
 * Evaluation Engine
 * Main orchestrator for system analysis - ports frontend analyzeSystem logic
 */

import type {
    CanvasNode,
    Connection,
    SystemConstraints,
    AnalysisResult,
    Suggestion,
    AssumptionInfo,
    Verdict,
} from '../../../shared/types';

import { detectBottlenecks, detectQueueBottlenecks } from './bottleneck.detector';
import {
    detectChainLatencyViolations,
    detectNodeLatencyViolations,
    buildFailurePropagationPaths,
} from './propagation.engine';
import {
    detectQueueGrowth,
    detectResourceExhaustion,
    calculateSaturationPoint,
} from './saturation.calculator';

export interface EvaluationOutput {
    analysis: AnalysisResult;
    suggestions: Suggestion[];
    saturationPointSec: number | null;
    maxThroughputRps: number;
}

/**
 * Track assumption sources for a node
 */
function trackAssumptions(node: CanvasNode): AssumptionInfo[] {
    const assumptions: AssumptionInfo[] = [];

    // Check if using default throughput
    if (!node.assumptions?.throughput || node.assumptions.throughput === 'default') {
        assumptions.push({
            nodeId: node.id,
            nodeName: node.config.name,
            field: 'throughput',
            value: node.config.throughput,
            source: 'default',
            impact: 'high',
            explanation: `Using default throughput of ${node.config.throughput.toLocaleString()} rps. Actual capacity may differ based on instance type and workload.`,
        });
    }

    // Check if using default latency
    if (!node.assumptions?.latency || node.assumptions.latency === 'default') {
        assumptions.push({
            nodeId: node.id,
            nodeName: node.config.name,
            field: 'latency',
            value: node.config.latency,
            source: 'default',
            impact: 'medium',
            explanation: `Using default p95 latency of ${node.config.latency}ms. Real latency depends on network and query complexity.`,
        });
    }

    // Check if using default scaling factor
    if (node.config.scalingFactor === 1) {
        assumptions.push({
            nodeId: node.id,
            nodeName: node.config.name,
            field: 'scalingFactor',
            value: 1,
            source: 'default',
            impact: 'high',
            explanation: `No horizontal scaling configured. Single instance handles all load.`,
        });
    }

    return assumptions;
}

/**
 * Generate suggestions based on analysis
 */
function generateSuggestions(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
    analysis: AnalysisResult,
): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Scaling suggestions for bottlenecks
    analysis.bottlenecks.forEach((bottleneck) => {
        const node = nodes.find((n) => n.id === bottleneck.nodeId);
        if (node) {
            const requiredScale = Math.ceil(
                constraints.peakRPS / node.config.throughput,
            );
            suggestions.push({
                id: `scale-${node.id}`,
                title: `Scale ${node.config.name} to ${requiredScale}x`,
                why: `Current capacity cannot sustain peak load. Scaling to ${requiredScale}x provides necessary headroom.`,
                tradeoff: 'Increased infrastructure cost. Additional operational complexity.',
                impact: 'high',
            });
        }
    });

    // Caching suggestions for high-latency databases
    const dbNodes = nodes.filter(
        (n) => n.type === 'postgresql' || n.type === 'mongodb',
    );
    const hasRedis = nodes.some((n) => n.type === 'redis');

    if (!hasRedis && constraints.readWriteRatio > 70) {
        dbNodes.forEach((db) => {
            if (db.config.latency > constraints.slaLatency * 0.5) {
                suggestions.push({
                    id: `cache-${db.id}`,
                    title: 'Add Redis caching layer',
                    why: `Read-heavy workload (${constraints.readWriteRatio}% reads) with database latency at ${db.config.latency}ms. Cache hit reduces p95 to sub-millisecond.`,
                    tradeoff: 'Cache invalidation complexity. Eventual consistency window.',
                    impact: 'high',
                });
            }
        });
    }

    // Async boundary suggestions for latency violations
    const hasQueue = nodes.some(
        (n) => n.type === 'kafka' || n.type === 'rabbitmq' || n.type === 'bullmq',
    );
    const hasChainViolation = analysis.warnings.some(
        (w) => w.type === 'latency-violation' && w.message.includes('chain'),
    );

    if (!hasQueue && hasChainViolation) {
        suggestions.push({
            id: 'async-boundary',
            title: 'Introduce async message queue',
            why: 'Synchronous dependency chain blocks requests. Async boundary allows deferring non-critical operations.',
            tradeoff: 'Eventual consistency. Increased system complexity. Requires idempotent consumers.',
            impact: 'high',
        });
    }

    // Consumer scaling suggestions for queue bottlenecks
    analysis.bottlenecks
        .filter((b) => b.reason.includes('Consumer'))
        .forEach((bottleneck) => {
            const queue = nodes.find((n) => n.id === bottleneck.nodeId);
            if (queue) {
                const consumers = connections
                    .filter((c) => c.sourceId === queue.id)
                    .map((c) => nodes.find((n) => n.id === c.targetId))
                    .filter(Boolean) as CanvasNode[];

                if (consumers.length > 0) {
                    suggestions.push({
                        id: `consumer-${queue.id}`,
                        title: `Scale ${queue.config.name} consumers`,
                        why: `Producer rate exceeds consumer capacity. Scale consumers to eliminate lag growth.`,
                        tradeoff: 'Increased compute cost. Potential out-of-order processing.',
                        impact: 'high',
                    });
                }
            }
        });

    return suggestions;
}

/**
 * Main analysis function - equivalent to frontend analyzeSystem
 */
export function analyzeSystem(
    nodes: CanvasNode[],
    connections: Connection[],
    constraints: SystemConstraints,
): EvaluationOutput {
    if (nodes.length === 0) {
        return {
            analysis: {
                verdict: 'pass',
                bottlenecks: [],
                warnings: [],
                assumptions: [],
            },
            suggestions: [],
            saturationPointSec: null,
            maxThroughputRps: 0,
        };
    }

    // Collect all assumptions
    const allAssumptions: AssumptionInfo[] = [];
    nodes.forEach((node) => {
        allAssumptions.push(...trackAssumptions(node));
    });

    // Detect bottlenecks
    const bottleneckResult = detectBottlenecks(nodes, connections, constraints);
    const queueBottlenecks = detectQueueBottlenecks(nodes, connections, constraints);
    const allBottlenecks = [...bottleneckResult.bottlenecks, ...queueBottlenecks];

    // Detect warnings
    const chainWarnings = detectChainLatencyViolations(nodes, connections, constraints);
    const nodeWarnings = detectNodeLatencyViolations(nodes, constraints);
    const queueWarnings = detectQueueGrowth(nodes, connections, constraints);
    const exhaustionWarnings = detectResourceExhaustion(nodes, constraints);
    const allWarnings = [...chainWarnings, ...nodeWarnings, ...queueWarnings, ...exhaustionWarnings];

    // Build failure propagation paths
    const bottleneckNodeIds = allBottlenecks.map((b) => b.nodeId);
    const failurePaths = buildFailurePropagationPaths(nodes, connections, bottleneckNodeIds);

    // Calculate saturation point
    const saturationPointSec = calculateSaturationPoint(nodes, connections, constraints);

    // Calculate max throughput (minimum effective throughput across all nodes)
    const maxThroughputRps = Math.min(
        ...nodes.map((n) => n.config.throughput * n.config.scalingFactor),
    );

    // Determine verdict
    let verdict: Verdict = 'pass';
    if (allBottlenecks.some((b) => b.severity === 'high' || b.severity === 'critical')) {
        verdict = 'fail';
    } else if (allBottlenecks.length > 0 || allWarnings.length > 0) {
        verdict = 'risky';
    }

    const analysis: AnalysisResult = {
        verdict,
        firstFailure: bottleneckResult.firstFailure,
        bottlenecks: allBottlenecks,
        warnings: allWarnings,
        failurePropagationPaths: failurePaths.length > 0 ? failurePaths : undefined,
        assumptions: allAssumptions,
    };

    // Generate suggestions
    const suggestions = generateSuggestions(nodes, connections, constraints, analysis);

    return {
        analysis,
        suggestions,
        saturationPointSec,
        maxThroughputRps,
    };
}
