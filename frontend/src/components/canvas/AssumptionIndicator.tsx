import { AssumptionSource } from '../../types';
import { Info } from 'lucide-react';

interface AssumptionIndicatorProps {
    source: AssumptionSource;
    explanation: string;
    value: number | string;
    field: string;
}

const sourceConfig = {
    default: {
        label: 'D',
        color: 'text-slate-400',
        bg: 'bg-slate-700',
        tooltip: 'Default value',
    },
    'user-provided': {
        label: 'U',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        tooltip: 'User-provided value',
    },
    heuristic: {
        label: 'H',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        tooltip: 'Heuristic estimate',
    },
};

export function AssumptionIndicator({ source, explanation, value, field }: AssumptionIndicatorProps) {
    const config = sourceConfig[source];

    return (
        <div className="group relative inline-flex items-center gap-1.5">
            <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${config.bg} ${config.color} border border-current`}
                title={config.tooltip}
            >
                {config.label}
            </span>

            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-300 mb-1">
                            {field} ({config.tooltip})
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">
                            {explanation}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
