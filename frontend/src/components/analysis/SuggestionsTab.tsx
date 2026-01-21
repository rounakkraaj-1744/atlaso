import { Lightbulb, ArrowRight } from 'lucide-react';

const mockSuggestions = [
    {
        action: 'Increase Kafka partitions from 3 to 12',
        rationale: 'Allows parallel consumption by more consumer instances, reducing lag buildup',
        tradeoff: 'Higher operational complexity and resource usage',
    },
    {
        action: 'Add Redis cache layer before PostgreSQL',
        rationale: 'Offload 80% of read traffic (based on read/write ratio) to sub-millisecond cache',
        tradeoff: 'Cache invalidation complexity and potential stale data',
    },
    {
        action: 'Split read and write paths with read replicas',
        rationale: 'Distribute read load across multiple PostgreSQL replicas',
        tradeoff: 'Eventual consistency between primary and replicas',
    },
];

export function SuggestionsTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                    Recommendations
                </h3>
                <p className="text-xs text-text-secondary">
                    Suggested improvements to address identified issues
                </p>
            </div>

            <div className="space-y-3">
                {mockSuggestions.map((suggestion, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-lg bg-bg-tertiary border border-border hover:border-accent-blue/50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded bg-accent-blue/20 flex items-center justify-center mt-0.5">
                                <Lightbulb className="w-4 h-4 text-accent-blue" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <h4 className="text-sm font-semibold text-text-primary">
                                    {suggestion.action}
                                </h4>

                                <div className="space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-accent-green mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-text-secondary">
                                            <span className="font-medium text-accent-green">Why:</span>{' '}
                                            {suggestion.rationale}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-accent-yellow mt-0.5 flex-shrink-0" />
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
