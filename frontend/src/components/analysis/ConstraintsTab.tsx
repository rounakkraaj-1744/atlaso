import { useState } from 'react';
import { Input } from '../ui/Input';
import { ScenarioSelector } from './ScenarioSelector';
import type { SystemConstraints, ScenarioPreset } from '../../types';
import { scenarioPresets } from '../../features/constraints/data/scenarios';

interface ConstraintsTabProps {
    constraints: SystemConstraints;
    onConstraintsChange: (constraints: SystemConstraints) => void;
}

export function ConstraintsTab({ constraints, onConstraintsChange }: ConstraintsTabProps) {
    const [currentScenario, setCurrentScenario] = useState<ScenarioPreset | 'custom'>('custom');

    const handleScenarioChange = (scenario: ScenarioPreset) => {
        setCurrentScenario(scenario);
        onConstraintsChange(scenarioPresets[scenario].constraints);
    };

    const handleConstraintUpdate = (updates: Partial<SystemConstraints>) => {
        setCurrentScenario('custom');
        onConstraintsChange({ ...constraints, ...updates });
    };

    return (
        <div className="space-y-4">
            <ScenarioSelector currentScenario={currentScenario} onScenarioChange={handleScenarioChange}/>

            <div className="border-t border-border pt-4">
                <div>
                    <h3 className="text-xs font-semibold text-slate-100 mb-1">
                        System Constraints
                    </h3>
                    <p className="text-[10px] text-slate-400">
                        Define expected load and performance requirements
                    </p>
                </div>

                <div className="space-y-3 mt-3">
                    <Input label="Average RPS" type="number" value={constraints.avgRPS} onChange={(e) => handleConstraintUpdate({ avgRPS: Number(e.target.value) })} unit="rps"/>
                    <Input label="Peak RPS" type="number" value={constraints.peakRPS} onChange={(e) => handleConstraintUpdate({ peakRPS: Number(e.target.value) })} unit="rps"/>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-200">
                            Read/Write Ratio
                        </label>
                        <div className="flex items-center gap-3">
                            <input type="range" min="0" max="100" value={constraints.readWriteRatio} onChange={(e) =>
                                    handleConstraintUpdate({ readWriteRatio: Number(e.target.value) })
                                } className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                            <span className="text-sm font-mono text-slate-200 w-16 text-right">
                                {constraints.readWriteRatio}% R
                            </span>
                        </div>
                    </div>

                    <Input label="Payload Size" type="number" value={constraints.payloadSize} onChange={(e) =>
                            handleConstraintUpdate({ payloadSize: Number(e.target.value) })
                        } unit="KB"/>

                    <Input label="SLA (p95 Latency)" type="number" value={constraints.slaLatency} onChange={(e) => handleConstraintUpdate({ slaLatency: Number(e.target.value) })} unit="ms" />

                    <Input label="Consumer Lag Tolerance" type="number" value={constraints.consumerLagTolerance} onChange={(e) =>
                            handleConstraintUpdate({ consumerLagTolerance: Number(e.target.value) })
                        } unit="ms" />
                </div>
            </div>
        </div>
    );
}