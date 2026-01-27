import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { analyzeSystem, type EvaluationOutput } from './engine';
import type { CanvasNode, Connection, SystemConstraints, Severity } from '../../shared/types';
import { Verdict as PrismaVerdict, Severity as PrismaSeverity } from '@prisma/client';

@Injectable()
export class EvaluationService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Run evaluation on an architecture with a scenario
     */
    async runEvaluation(architectureId: string, scenarioId: string): Promise<{
        evaluationRun: unknown;
        output: EvaluationOutput;
    }> {
        // Get architecture
        const architecture = await this.prisma.architecture.findUnique({
            where: { id: architectureId },
        });
        if (!architecture) {
            throw new NotFoundException(`Architecture ${architectureId} not found`);
        }

        // Get scenario
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new NotFoundException(`Scenario ${scenarioId} not found`);
        }

        const nodes = architecture.nodes as unknown as CanvasNode[];
        const edges = architecture.edges as unknown as Connection[];
        const constraints = scenario.constraints as unknown as SystemConstraints;

        // Run analysis
        const output = analyzeSystem(nodes, edges, constraints);

        // Map verdict to Prisma enum
        const verdictMap: Record<string, PrismaVerdict> = {
            pass: 'PASS',
            risky: 'RISKY',
            fail: 'FAIL',
        };

        // Map severity to Prisma enum
        const severityMap: Record<Severity, PrismaSeverity> = {
            low: 'LOW',
            medium: 'MEDIUM',
            high: 'HIGH',
            critical: 'CRITICAL',
        };

        // Create evaluation run
        const evaluationRun = await this.prisma.evaluationRun.create({
            data: {
                architectureId,
                scenarioId,
                verdict: verdictMap[output.analysis.verdict],
                saturationPointSec: output.saturationPointSec,
                maxThroughPutRps: output.maxThroughputRps,
            },
        });

        // Create bottlenecks
        for (let i = 0; i < output.analysis.bottlenecks.length; i++) {
            const bottleneck = output.analysis.bottlenecks[i];
            await this.prisma.bottlenecks.create({
                data: {
                    evaluationRunId: evaluationRun.id,
                    nodeId: bottleneck.nodeId,
                    componentKey: bottleneck.nodeName,
                    severity: severityMap[bottleneck.severity],
                    reason: bottleneck.reason,
                    metrics: {
                        timeToFailure: bottleneck.timeToFailure,
                        upstreamSources: bottleneck.upstreamSources,
                        downstreamImpacts: bottleneck.downstreamImpacts,
                    },
                    orderIndex: i,
                },
            });
        }

        // Create explanations for warnings
        for (const warning of output.analysis.warnings) {
            await this.prisma.explanations.create({
                data: {
                    evaluationRunId: evaluationRun.id,
                    message: warning.message,
                    severity: warning.timeToFailure && warning.timeToFailure < 60 ? 'HIGH' : 'MEDIUM',
                    assumptionsUsed: {},
                },
            });
        }

        // Create explanations for assumptions
        for (const assumption of output.analysis.assumptions) {
            await this.prisma.explanations.create({
                data: {
                    evaluationRunId: evaluationRun.id,
                    message: assumption.explanation,
                    severity: severityMap[assumption.impact],
                    relatedNodeId: assumption.nodeId,
                    assumptionsUsed: {
                        field: assumption.field,
                        value: assumption.value,
                        source: assumption.source,
                    },
                },
            });
        }

        return {
            evaluationRun: await this.findOne(evaluationRun.id),
            output,
        };
    }

    /**
     * Run evaluation inline (without persisting to DB)
     */
    analyzeInline(
        nodes: CanvasNode[],
        edges: Connection[],
        constraints: SystemConstraints,
    ): EvaluationOutput {
        return analyzeSystem(nodes, edges, constraints);
    }

    /**
     * Get evaluation by ID
     */
    async findOne(id: string) {
        const evaluation = await this.prisma.evaluationRun.findUnique({
            where: { id },
            include: {
                bottlenecks: { orderBy: { orderIndex: 'asc' } },
                explanations: true,
                architecture: {
                    select: { id: true, name: true },
                },
                scenario: {
                    select: { id: true, name: true, type: true },
                },
            },
        });

        if (!evaluation) {
            throw new NotFoundException(`Evaluation ${id} not found`);
        }

        return evaluation;
    }

    /**
     * Get evaluations for an architecture
     */
    async findByArchitecture(architectureId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.evaluationRun.findMany({
                where: { architectureId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    scenario: { select: { name: true, type: true } },
                    bottlenecks: { select: { severity: true } },
                },
            }),
            this.prisma.evaluationRun.count({ where: { architectureId } }),
        ]);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Delete evaluation
     */
    async remove(id: string) {
        await this.findOne(id);

        // Delete related records first
        await this.prisma.bottlenecks.deleteMany({ where: { evaluationRunId: id } });
        await this.prisma.explanations.deleteMany({ where: { evaluationRunId: id } });

        return this.prisma.evaluationRun.delete({ where: { id } });
    }
}
