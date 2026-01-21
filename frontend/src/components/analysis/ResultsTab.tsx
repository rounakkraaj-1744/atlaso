import { Badge } from '../ui/Badge';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Flame } from 'lucide-react';
import { AnalysisResult } from '../../types';

interface ResultsTabProps {
    analysis: AnalysisResult | null;
}

export function ResultsTab({ analysis }: ResultsTabProps) {
    if (!analysis) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                    <div className="text-slate-500 text-sm">No analysis results yet</div>
                    <div className="text-slate-600 text-xs">Run analysis to see results</div>
                </div>
            </div>
        );
    }

    const verdictConfig = {
        pass: {
            icon: CheckCircle2,
            color: 'text-accent-green',
            bg: 'bg-accent-green/10',
            border: 'border-accent-green/30',
            message: 'Architecture can sustain expected load.',
        },
        risky: {
            icon: AlertTriangle,
            color: 'text-accent-yellow',
            bg: 'bg-accent-yellow/10',
            border: 'border-accent-yellow/30',
            message: 'Architecture will degrade under peak load.',
        },
        fail: {
            icon: AlertCircle,
            color: 'text-accent-red',
            bg: 'bg-accent-red/10',
            border: 'border-accent-red/30',
            message: 'Architecture cannot handle expected load. System fails.',
        },
    };

    const config = verdictConfig[analysis.verdict];
    const Icon = config.icon;

    // Sort bottlenecks by time to failure (most critical first)
    const sortedBottlenecks = [...analysis.bottlenecks].sort((a, b) => {
        const timeA = a.timeToFailure ?? Infinity;
        const timeB = b.timeToFailure ?? Infinity;
        return timeA - timeB;
    });

    return (
        <div className="space-y-6">
            {/* Overall Verdict */}
            <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-primary">Overall Verdict</h3>
                            <Badge variant={analysis.verdict}>{analysis.verdict.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{config.message}</p>
                    </div>
                </div>
            </div>

            {/* First Failure - OPINIONATED: What breaks first */}
            {analysis.firstFailure && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-red-400" />
                        <h3 className="text-sm font-semibold text-text-primary">First Point of Failure</h3>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-red-400" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-red-300">
                                        {analysis.firstFailure.nodeName}
                                    </span>
                                    <span className="text-xs font-mono text-red-400">
                                        T+{analysis.firstFailure.timeToFailure}s
                                    </span>
                                </div>
                                <p className="text-sm text-text-primary leading-relaxed">
                                    {analysis.firstFailure.reason}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottlenecks - Ranked by severity and time-to-failure */}
            {sortedBottlenecks.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                        Bottleneck Components ({sortedBottlenecks.length})
                    </h3>
                    <div className="space-y-2">
                        {sortedBottlenecks.map((bottleneck, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg bg-bg-tertiary border border-border hover:border-accent-blue/30 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${bottleneck.severity === 'high'
                                                ? 'bg-accent-red'
                                                : bottleneck.severity === 'medium'
                                                    ? 'bg-accent-yellow'
                                                    : 'bg-accent-blue'
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-text-primary">
                                                {bottleneck.nodeName}
                                            </span>
                                            {bottleneck.timeToFailure && (
                                                <span className="text-xs font-mono text-slate-400">
                                                    Fails at T+{bottleneck.timeToFailure}s
                                                </span>
                                            )}
                                            <Badge
                                                variant={
                                                    bottleneck.severity === 'high'
                                                        ? 'fail'
                                                        : bottleneck.severity === 'medium'
                                                            ? 'risky'
                                                            : 'pass'
                                                }
                                            >
                                                {bottleneck.severity.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-text-primary leading-relaxed">
                                            {bottleneck.reason}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                        System Warnings ({analysis.warnings.length})
                    </h3>
                    <div className="space-y-2">
                        {analysis.warnings.map((warning, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30"
                            >
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-accent-yellow mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        {warning.timeToFailure && (
                                            <div className="text-xs font-mono text-accent-yellow mb-1">
                                                T+{warning.timeToFailure}s
                                            </div>
                                        )}
                                        <p className="text-sm text-text-primary leading-relaxed">{warning.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assumptions Warning */}
            {analysis.assumptions && analysis.assumptions.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-blue-300 font-semibold mb-1">
                                Analysis relies on {analysis.assumptions.length} default assumptions
                            </p>
                            <p className="text-xs text-text-secondary">
                                Review the Assumptions tab to verify capacity estimates match your infrastructure.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

