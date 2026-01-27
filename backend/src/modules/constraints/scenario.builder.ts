import type { SystemConstraints } from '../../shared/types';
import { scenarioPresets, type ScenarioPreset } from './scenario-presets';

export class ScenarioBuilder {
    private constraints: SystemConstraints;
    private type: string;
    private name: string;

    constructor() {
        const normalPreset = scenarioPresets.find((p) => p.type === 'normal')!;
        this.constraints = { ...normalPreset.constraints };
        this.type = 'custom';
        this.name = 'Custom Scenario';
    }

    static fromPreset(presetType: string): ScenarioBuilder {
        const builder = new ScenarioBuilder();
        const preset = scenarioPresets.find((p) => p.type === presetType);
        if (preset) {
            builder.constraints = { ...preset.constraints };
            builder.type = preset.type;
            builder.name = preset.name;
        }
        return builder;
    }

    withName(name: string): this {
        this.name = name;
        return this;
    }

    withAvgRPS(avgRPS: number): this {
        this.constraints.avgRPS = avgRPS;
        return this;
    }

    withPeakRPS(peakRPS: number): this {
        this.constraints.peakRPS = peakRPS;
        return this;
    }

    withReadWriteRatio(ratio: number): this {
        this.constraints.readWriteRatio = Math.min(100, Math.max(0, ratio));
        return this;
    }

    withPayloadSize(sizeKB: number): this {
        this.constraints.payloadSize = sizeKB;
        return this;
    }

    withSLALatency(latencyMs: number): this {
        this.constraints.slaLatency = latencyMs;
        return this;
    }

    withRetryAttempts(attempts: number): this {
        this.constraints.retryAttempts = Math.min(20, Math.max(0, attempts));
        return this;
    }

    withRateLimit(rps: number): this {
        this.constraints.rateLimitRPS = rps;
        return this;
    }

    withConsumerLagTolerance(messages: number): this {
        this.constraints.consumerLagTolerance = messages;
        return this;
    }

    scaleLoad(factor: number): this {
        this.constraints.avgRPS = Math.round(this.constraints.avgRPS * factor);
        this.constraints.peakRPS = Math.round(this.constraints.peakRPS * factor);
        this.constraints.rateLimitRPS = Math.round(this.constraints.rateLimitRPS * factor);
        return this;
    }

    build(): { type: string; name: string; constraints: SystemConstraints } {
        return {
            type: this.type,
            name: this.name,
            constraints: { ...this.constraints },
        };
    }
}