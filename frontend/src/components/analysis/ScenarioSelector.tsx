import { scenarioPresets } from '../../features/constraints/data/scenarios';
import type { ScenarioPreset } from '../../types';
import { Zap, TrendingUp, AlertTriangle, Activity } from '../../lib/icons';

interface ScenarioSelectorProps {
    currentScenario: ScenarioPreset | 'custom';
    onScenarioChange: (scenario: ScenarioPreset) => void;
}

const scenarioIcons = {
    normal: Activity,
    'flash-sale': Zap,
    'black-friday': TrendingUp,
    incident: AlertTriangle,
};

const scenarioColors = {
    normal: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20',
    'flash-sale': 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20',
    'black-friday': 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20',
    incident: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20',
};

export function ScenarioSelector({ currentScenario, onScenarioChange }: ScenarioSelectorProps) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    Load Scenarios
                </h3>
                <p className="text-xs text-slate-400">
                    Quick presets for different traffic patterns
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {(Object.keys(scenarioPresets) as ScenarioPreset[]).map((key) => {
                    const scenario = scenarioPresets[key];
                    const Icon = scenarioIcons[key];
                    const isActive = currentScenario === key;

                    return (
                        <button key={key} onClick={() => onScenarioChange(key)} className={`p-2 rounded-lg border transition-all ${isActive
                                ? scenarioColors[key] + ' ring-2 ring-current'
                                : 'bg-slate-900 border-white/10 hover:border-blue-500/50'
                                }`} >
                            <div className="flex items-start gap-2">
                                <Icon className={`w-3.5 h-3.5 mt-0.5 ${isActive ? '' : 'text-slate-500'}`} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className={`text-xs font-semibold ${isActive ? '' : 'text-slate-200'}`}>
                                        {scenario.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                        {scenario.description}
                                    </div>
                                    {isActive && (
                                        <div className="mt-1 pt-1 border-t border-current/20 text-[10px] font-mono">
                                            {scenario.constraints.peakRPS.toLocaleString()} peak rps
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {currentScenario === 'custom' && (
                <div className="p-2 bg-slate-700/30 border border-slate-600 rounded text-xs text-slate-400">
                    Custom scenario active
                </div>
            )}
        </div>
    );
}