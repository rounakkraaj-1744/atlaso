import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import type { CanvasNode, Connection } from '../../shared/types';

export interface DiffResult {
    addedNodes: string[];
    removedNodes: string[];
    modifiedNodes: string[];
    addedConnections: string[];
    removedConnections: string[];
    [key: string]: string[]; // Index signature for JSON compatibility
}

export interface ComparisonMetrics {
    bottlenecksBefore: number;
    bottlenecksAfter: number;
    warningsBefore: number;
    warningsAfter: number;
    verdictBefore: string;
    verdictAfter: string;
    [key: string]: number | string; // Index signature for JSON compatibility
}

@Injectable()
export class ComparisonService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Compare two architectures
     */
    async compare(baseId: string, modifiedId: string) {
        const [base, modified] = await Promise.all([
            this.prisma.architecture.findUnique({ where: { id: baseId } }),
            this.prisma.architecture.findUnique({ where: { id: modifiedId } }),
        ]);

        if (!base) throw new NotFoundException(`Architecture ${baseId} not found`);
        if (!modified) throw new NotFoundException(`Architecture ${modifiedId} not found`);

        const baseNodes = base.nodes as unknown as CanvasNode[];
        const modifiedNodesData = modified.nodes as unknown as CanvasNode[];
        const baseEdges = base.edges as unknown as Connection[];
        const modifiedEdges = modified.edges as unknown as Connection[];

        const diff = this.calculateDiff(baseNodes, modifiedNodesData, baseEdges, modifiedEdges);

        // Get latest evaluations for metrics comparison
        const [baseEval, modifiedEval] = await Promise.all([
            this.prisma.evaluationRun.findFirst({
                where: { architectureId: baseId },
                orderBy: { createdAt: 'desc' },
                include: { bottlenecks: true, explanations: true },
            }),
            this.prisma.evaluationRun.findFirst({
                where: { architectureId: modifiedId },
                orderBy: { createdAt: 'desc' },
                include: { bottlenecks: true, explanations: true },
            }),
        ]);

        const metrics: ComparisonMetrics = {
            bottlenecksBefore: baseEval?.bottlenecks.length || 0,
            bottlenecksAfter: modifiedEval?.bottlenecks.length || 0,
            warningsBefore: baseEval?.explanations.filter((e) => e.severity === 'HIGH').length || 0,
            warningsAfter: modifiedEval?.explanations.filter((e) => e.severity === 'HIGH').length || 0,
            verdictBefore: baseEval?.verdict || 'UNKNOWN',
            verdictAfter: modifiedEval?.verdict || 'UNKNOWN',
        };

        // Persist comparison
        const comparison = await this.prisma.architectureComparison.create({
            data: {
                baseArchitectureId: baseId,
                modifiedArchitectureId: modifiedId,
                deltaSummary: { diff, metrics } as unknown as object,
            },
        });

        return {
            id: comparison.id,
            base: { id: base.id, name: base.name },
            modified: { id: modified.id, name: modified.name },
            diff,
            metrics,
            createdAt: comparison.createdAt,
        };
    }

    /**
     * Calculate diff between two architectures
     */
    private calculateDiff(
        baseNodes: CanvasNode[],
        targetNodes: CanvasNode[],
        baseEdges: Connection[],
        targetEdges: Connection[],
    ): DiffResult {
        const baseNodeIds = new Set(baseNodes.map((n) => n.id));
        const targetNodeIds = new Set(targetNodes.map((n) => n.id));
        const baseEdgeIds = new Set(baseEdges.map((e) => e.id));
        const targetEdgeIds = new Set(targetEdges.map((e) => e.id));

        // Node changes
        const addedNodes = [...targetNodeIds].filter((id) => !baseNodeIds.has(id));
        const removedNodes = [...baseNodeIds].filter((id) => !targetNodeIds.has(id));
        const changedNodes: string[] = [];

        // Check for modifications in common nodes
        baseNodes.forEach((baseNode) => {
            const targetNode = targetNodes.find((n) => n.id === baseNode.id);
            if (targetNode) {
                const hasConfigChange =
                    baseNode.config.throughput !== targetNode.config.throughput ||
                    baseNode.config.latency !== targetNode.config.latency ||
                    baseNode.config.scalingFactor !== targetNode.config.scalingFactor;
                if (hasConfigChange) {
                    changedNodes.push(baseNode.id);
                }
            }
        });

        // Edge changes
        const addedConnections = [...targetEdgeIds].filter((id) => !baseEdgeIds.has(id));
        const removedConnections = [...baseEdgeIds].filter((id) => !targetEdgeIds.has(id));

        return {
            addedNodes,
            removedNodes,
            modifiedNodes: changedNodes,
            addedConnections,
            removedConnections,
        };
    }

    /**
     * Get comparison by ID
     */
    async findOne(id: string) {
        const comparison = await this.prisma.architectureComparison.findUnique({
            where: { id },
        });

        if (!comparison) {
            throw new NotFoundException(`Comparison ${id} not found`);
        }

        return comparison;
    }

    /**
     * Get all comparisons
     */
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.architectureComparison.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.architectureComparison.count(),
        ]);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
