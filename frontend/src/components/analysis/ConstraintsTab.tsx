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
    const [currentScenario, setCurrentScenario] = useState<ScenarioPreset | 'custom'>('normal');

    const handleScenarioChange = (scenario: ScenarioPreset) => {
        setCurrentScenario(scenario);
        onConstraintsChange(scenarioPresets[scenario].constraints);
    };

    const handleConstraintUpdate = (updates: Partial<SystemConstraints>) => {
        setCurrentScenario('custom');
        onConstraintsChange({ ...constraints, ...updates });
    };

    return (
        <div className="space-y-6">
            {/* Scenario Selector */}
            <ScenarioSelector
                currentScenario={currentScenario}
                onScenarioChange={handleScenarioChange}
                currentConstraints={constraints}
            />

            <div className="border-t border-border pt-6">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                        System Constraints
                    </h3>
                    <p className="text-xs text-text-secondary">
                        Define expected load and performance requirements
                    </p>
                </div>

                <div className="space-y-4 mt-4">
                    <Input
                        label="Average RPS"
                        type="number"
                        value={constraints.avgRPS}
                        onChange={(e) => handleConstraintUpdate({ avgRPS: Number(e.target.value) })}
                        unit="rps"
                    />

                    <Input
                        label="Peak RPS"
                        type="number"
                        value={constraints.peakRPS}
                        onChange={(e) => handleConstraintUpdate({ peakRPS: Number(e.target.value) })}
                        unit="rps"
                    />

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary">
                            Read/Write Ratio
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={constraints.readWriteRatio}
                                onChange={(e) =>
                                    handleConstraintUpdate({ readWriteRatio: Number(e.target.value) })
                                }
                                className="flex-1 h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue"
                            />
                            <span className="text-sm font-mono text-text-primary w-16 text-right">
                                {constraints.readWriteRatio}% R
                            </span>
                        </div>
                    </div>

                    <Input
                        label="Payload Size"
                        type="number"
                        value={constraints.payloadSize}
                        onChange={(e) =>
                            handleConstraintUpdate({ payloadSize: Number(e.target.value) })
                        }
                        unit="KB"
                    />

                    <Input
                        label="SLA (p95 Latency)"
                        type="number"
                        value={constraints.slaLatency}
                        onChange={(e) => handleConstraintUpdate({ slaLatency: Number(e.target.value) })}
                        unit="ms"
                    />

                    <Input
                        label="Consumer Lag Tolerance"
                        type="number"
                        value={constraints.consumerLagTolerance}
                        onChange={(e) =>
                            handleConstraintUpdate({ consumerLagTolerance: Number(e.target.value) })
                        }
                        unit="ms"
                    />
                </div>
            </div>
        </div>
    );
}

