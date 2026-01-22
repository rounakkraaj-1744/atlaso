import type { AnalysisResult } from '../../types';
import { Info, AlertTriangle } from 'lucide-react';
import { AssumptionIndicator } from '../canvas/AssumptionIndicator';

interface AssumptionsTabProps {
    analysis: AnalysisResult | null;
}

export function AssumptionsTab({ analysis }: AssumptionsTabProps) {
    if (!analysis || !analysis.assumptions || analysis.assumptions.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                    <div className="text-slate-500 text-sm">No assumptions tracked</div>
                    <div className="text-slate-600 text-xs">Run analysis to see assumptions</div>
                </div>
            </div>
        );
    }

    // Group assumptions by impact level
    const highImpact = analysis.assumptions.filter(a => a.impact === 'high');
    const mediumImpact = analysis.assumptions.filter(a => a.impact === 'medium');
    const lowImpact = analysis.assumptions.filter(a => a.impact === 'low');

    const renderAssumptionGroup = (
        assumptions: typeof analysis.assumptions,
        title: string,
        color: string
    ) => {
        if (assumptions.length === 0) return null;

        return (
            <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                    {title} ({assumptions.length})
                </h3>
                <div className="space-y-2">
                    {assumptions.map((assumption, idx) => (
                        <div
                            key={idx}
                            className="p-3 rounded-lg bg-bg-tertiary border border-border"
                        >
                            <div className="flex items-start gap-3">
                                <AssumptionIndicator
                                    source={assumption.source}
                                    explanation={assumption.explanation}
                                    value={assumption.value}
                                    field={assumption.field}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-text-primary">
                                            {assumption.nodeName}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {assumption.field}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 mb-2">
                                        Value: {typeof assumption.value === 'number'
                                            ? assumption.value.toLocaleString()
                                            : assumption.value}
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        {assumption.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Warning Banner */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-300 font-semibold mb-1">
                            Assumptions Impact Analysis Accuracy
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Default values are estimates. Verify these match your actual infrastructure
                            configuration for accurate analysis. Click [D] badges for explanations.
                        </p>
                    </div>
                </div>
            </div>

            {/* High Impact Assumptions */}
            {renderAssumptionGroup(highImpact, 'High Impact Assumptions', 'red')}

            {/* Medium Impact Assumptions */}
            {renderAssumptionGroup(mediumImpact, 'Medium Impact Assumptions', 'yellow')}

            {/* Low Impact Assumptions */}
            {renderAssumptionGroup(lowImpact, 'Low Impact Assumptions', 'blue')}

            {/* Recommendations */}
            {highImpact.length > 0 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-orange-300 font-semibold mb-1">
                                {highImpact.length} High-Impact Assumptions Detected
                            </p>
                            <p className="text-xs text-text-secondary">
                                These assumptions significantly affect analysis conclusions.
                                Consider providing actual values for more accurate results.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
