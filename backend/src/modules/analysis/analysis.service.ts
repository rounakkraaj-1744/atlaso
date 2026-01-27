import { Injectable } from '@nestjs/common';
import { EvaluationService } from '../evaluation/evaluation.service';
import type { CanvasNode, Connection, SystemConstraints, AnalysisResult, Suggestion } from '../../shared/types';

@Injectable()
export class AnalysisService {
    constructor(private readonly evaluationService: EvaluationService) { }

    /**
     * Analyze architecture inline (without persistence)
     */
    analyze(
        nodes: CanvasNode[],
        edges: Connection[],
        constraints: SystemConstraints,
    ): { analysis: AnalysisResult; suggestions: Suggestion[] } {
        const output = this.evaluationService.analyzeInline(nodes, edges, constraints);
        return {
            analysis: output.analysis,
            suggestions: output.suggestions,
        };
    }

    /**
     * Rank suggestions by impact
     */
    rankSuggestions(suggestions: Suggestion[]): Suggestion[] {
        const impactOrder: Record<string, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
        };

        return [...suggestions].sort(
            (a, b) => (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0),
        );
    }

    /**
     * Format analysis summary for display
     */
    formatSummary(analysis: AnalysisResult): string {
        const parts: string[] = [];

        // Verdict
        parts.push(`Verdict: ${analysis.verdict.toUpperCase()}`);

        // First failure
        if (analysis.firstFailure) {
            parts.push(
                `First failure expected at ${analysis.firstFailure.nodeName} after ~${analysis.firstFailure.timeToFailure}s`,
            );
        }

        // Bottleneck count
        if (analysis.bottlenecks.length > 0) {
            const highSeverity = analysis.bottlenecks.filter(
                (b) => b.severity === 'high' || b.severity === 'critical',
            ).length;
            parts.push(`${analysis.bottlenecks.length} bottlenecks (${highSeverity} critical)`);
        }

        // Warning count
        if (analysis.warnings.length > 0) {
            parts.push(`${analysis.warnings.length} warnings`);
        }

        // Assumption count
        if (analysis.assumptions.length > 0) {
            const highImpact = analysis.assumptions.filter((a) => a.impact === 'high').length;
            parts.push(`${analysis.assumptions.length} assumptions (${highImpact} high impact)`);
        }

        return parts.join(' | ');
    }
}
