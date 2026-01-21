import { Badge } from '../ui/Badge';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Mock analysis result for demonstration
const mockResult = {
    verdict: 'risky' as const,
    bottlenecks: [
        {
            nodeId: 'node_1',
            severity: 'high' as const,
            reason: 'PostgreSQL throughput (5000 rps) is below peak load (5000 rps). Database will saturate under burst traffic.',
        },
        {
            nodeId: 'node_2',
            severity: 'medium' as const,
            reason: 'API Server latency (50ms) + DB latency (20ms) approaches SLA limit (200ms) with minimal headroom.',
        },
    ],
    warnings: [
        {
            type: 'queue-growth' as const,
            message: 'Kafka consumer throughput is lower than producer rate. Consumer lag increases unbounded after ~2 minutes.',
        },
    ],
    suggestions: [],
};

export function ResultsTab() {
    const result = mockResult;

    const verdictConfig = {
        pass: {
            icon: CheckCircle2,
            color: 'text-accent-green',
            bg: 'bg-accent-green/10',
            border: 'border-accent-green/30',
        },
        risky: {
            icon: AlertTriangle,
            color: 'text-accent-yellow',
            bg: 'bg-accent-yellow/10',
            border: 'border-accent-yellow/30',
        },
        fail: {
            icon: AlertCircle,
            color: 'text-accent-red',
            bg: 'bg-accent-red/10',
            border: 'border-accent-red/30',
        },
    };

    const config = verdictConfig[result.verdict];
    const Icon = config.icon;

    return (
        <div className="space-y-6">
            {/* Overall Verdict */}
            <div
                className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-primary">
                                Overall Verdict
                            </h3>
                            <Badge variant={result.verdict}>
                                {result.verdict.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">
                            {result.verdict === 'pass' && 'Architecture can handle expected load'}
                            {result.verdict === 'risky' && 'Architecture may struggle under peak load'}
                            {result.verdict === 'fail' && 'Architecture will fail under expected load'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottlenecks */}
            {result.bottlenecks.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                        Bottleneck Components
                    </h3>
                    <div className="space-y-2">
                        {result.bottlenecks.map((bottleneck, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg bg-bg-tertiary border border-border"
                            >
                                <div className="flex items-start gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full mt-1.5 ${bottleneck.severity === 'high'
                                                ? 'bg-accent-red'
                                                : bottleneck.severity === 'medium'
                                                    ? 'bg-accent-yellow'
                                                    : 'bg-accent-blue'
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
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
            {result.warnings.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                        Warnings
                    </h3>
                    <div className="space-y-2">
                        {result.warnings.map((warning, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30"
                            >
                                <p className="text-sm text-text-primary leading-relaxed">
                                    {warning.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
