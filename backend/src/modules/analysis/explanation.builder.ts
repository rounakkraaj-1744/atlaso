import type { AnalysisResult, BottleneckInfo, WarningInfo, AssumptionInfo } from '../../shared/types';

export interface FormattedExplanation {
    type: 'bottleneck' | 'warning' | 'assumption';
    severity: string;
    title: string;
    message: string;
    nodeId?: string;
    timeToFailure?: number;
}

function buildBottleneckExplanations(bottlenecks: BottleneckInfo[]): FormattedExplanation[] {
    return bottlenecks.map((b) => ({
        type: 'bottleneck' as const,
        severity: b.severity,
        title: `Bottleneck at ${b.nodeName}`,
        message: b.reason,
        nodeId: b.nodeId,
        timeToFailure: b.timeToFailure,
    }));
}

function buildWarningExplanations(warnings: WarningInfo[]): FormattedExplanation[] {
    return warnings.map((w) => ({
        type: 'warning' as const,
        severity: w.timeToFailure && w.timeToFailure < 60 ? 'high' : 'medium',
        title: `${w.type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
        message: w.message,
        timeToFailure: w.timeToFailure,
    }));
}

function buildAssumptionExplanations(assumptions: AssumptionInfo[]): FormattedExplanation[] {
    return assumptions.map((a) => ({
        type: 'assumption' as const,
        severity: a.impact,
        title: `Assumption: ${a.field} for ${a.nodeName}`,
        message: a.explanation,
        nodeId: a.nodeId,
    }));
}

export function buildExplanations(analysis: AnalysisResult): FormattedExplanation[] {
    return [
        ...buildBottleneckExplanations(analysis.bottlenecks),
        ...buildWarningExplanations(analysis.warnings),
        ...buildAssumptionExplanations(analysis.assumptions),
    ];
}

export function buildExecutiveSummary(analysis: AnalysisResult): string {
    const lines: string[] = [];

    const verdictEmoji = {
        pass: '✅',
        risky: '⚠️',
        fail: '❌',
    };
    lines.push(`${verdictEmoji[analysis.verdict]} System verdict: ${analysis.verdict.toUpperCase()}`);

    if (analysis.firstFailure) {
        lines.push('');
        lines.push(`🔥 First failure predicted:`);
        lines.push(`   Component: ${analysis.firstFailure.nodeName}`);
        lines.push(`   Time to failure: ~${analysis.firstFailure.timeToFailure} seconds`);
        lines.push(`   Reason: ${analysis.firstFailure.reason}`);
    }

    if (analysis.bottlenecks.length > 0) {
        lines.push('');
        lines.push(`🚧 Bottlenecks detected: ${analysis.bottlenecks.length}`);
        const critical = analysis.bottlenecks.filter((b) => b.severity === 'high' || b.severity === 'critical');
        if (critical.length > 0)
            lines.push(`   Critical: ${critical.map((b) => b.nodeName).join(', ')}`);
    }

    if (analysis.warnings.length > 0) {
        lines.push('');
        lines.push(`⚡ Warnings: ${analysis.warnings.length}`);
        const types = [...new Set(analysis.warnings.map((w) => w.type))];
        types.forEach((type) => {
            const count = analysis.warnings.filter((w) => w.type === type).length;
            lines.push(`   ${type.replace(/-/g, ' ')}: ${count}`);
        });
    }

    return lines.join('\n');
}