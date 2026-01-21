import { useConstraintsStore } from '../../stores/constraintsStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ConstraintsTab() {
    const { constraints, updateConstraints } = useConstraintsStore();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                    System Constraints
                </h3>
                <p className="text-xs text-text-secondary">
                    Define expected load and performance requirements
                </p>
            </div>

            <div className="space-y-4">
                <Input
                    label="Average RPS"
                    type="number"
                    value={constraints.avgRps}
                    onChange={(e) => updateConstraints({ avgRps: Number(e.target.value) })}
                    unit="rps"
                />

                <Input
                    label="Peak RPS"
                    type="number"
                    value={constraints.peakRps}
                    onChange={(e) => updateConstraints({ peakRps: Number(e.target.value) })}
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
                                updateConstraints({ readWriteRatio: Number(e.target.value) })
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
                    value={constraints.payloadSizeKb}
                    onChange={(e) =>
                        updateConstraints({ payloadSizeKb: Number(e.target.value) })
                    }
                    unit="KB"
                />

                <Input
                    label="SLA (p95 Latency)"
                    type="number"
                    value={constraints.slaP95Ms}
                    onChange={(e) => updateConstraints({ slaP95Ms: Number(e.target.value) })}
                    unit="ms"
                />

                <Input
                    label="Consumer Lag Tolerance"
                    type="number"
                    value={constraints.consumerLagToleranceMs}
                    onChange={(e) =>
                        updateConstraints({ consumerLagToleranceMs: Number(e.target.value) })
                    }
                    unit="ms"
                />
            </div>

            <div className="pt-4 border-t border-border">
                <Button className="w-full">Run Analysis</Button>
            </div>
        </div>
    );
}
