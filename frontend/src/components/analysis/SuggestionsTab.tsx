import { Lightbulb, ArrowRight } from 'lucide-react';
import type { Suggestion } from '../../types';

interface SuggestionsTabProps {
    suggestions: Suggestion[];
}

export function SuggestionsTab({ suggestions }: SuggestionsTabProps) {
    if (suggestions.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-600" />
                    <div className="text-slate-500 text-sm">No suggestions at this time</div>
                    <div className="text-slate-600 text-xs">System appears optimal</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                    Recommendations ({suggestions.length})
                </h3>
                <p className="text-xs text-text-secondary">
                    Suggested improvements to address identified issues
                </p>
            </div>

            <div className="space-y-3">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.id}
                        className={`p-4 rounded-lg border transition-colors ${suggestion.impact === 'high'
                            ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                            : suggestion.impact === 'medium'
                                ? 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/50'
                                : 'bg-bg-tertiary border-border hover:border-accent-blue/50'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5 ${suggestion.impact === 'high'
                                    ? 'bg-emerald-500/20'
                                    : suggestion.impact === 'medium'
                                        ? 'bg-blue-500/20'
                                        : 'bg-accent-blue/20'
                                    }`}
                            >
                                <Lightbulb
                                    className={`w-4 h-4 ${suggestion.impact === 'high'
                                        ? 'text-emerald-400'
                                        : suggestion.impact === 'medium'
                                            ? 'text-blue-400'
                                            : 'text-accent-blue'
                                        }`}
                                />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-text-primary">
                                        {suggestion.title}
                                    </h4>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${suggestion.impact === 'high'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : suggestion.impact === 'medium'
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : 'bg-slate-700/50 text-slate-400'
                                            }`}
                                    >
                                        {suggestion.impact}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-accent-green mt-0.5 shrink-0" />
                                        <p className="text-xs text-text-secondary">
                                            <span className="font-medium text-accent-green">Why:</span>{' '}
                                            {suggestion.why}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-accent-yellow mt-0.5 shrink-0" />
                                        <p className="text-xs text-text-secondary">
                                            <span className="font-medium text-accent-yellow">Tradeoff:</span>{' '}
                                            {suggestion.tradeoff}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
