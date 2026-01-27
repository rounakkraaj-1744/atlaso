import { Injectable } from '@nestjs/common';
import type { Suggestion, BottleneckInfo, Severity } from '../../shared/types';

@Injectable()
export class RankingService {
    private readonly impactOrder: Record<Severity, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
    };
  
    rankSuggestions(suggestions: Suggestion[]): Suggestion[] {
        return [...suggestions].sort(
            (a, b) =>
                (this.impactOrder[b.impact] || 0) - (this.impactOrder[a.impact] || 0),
        );
    }

    rankBottlenecks(bottlenecks: BottleneckInfo[]): BottleneckInfo[] {
        return [...bottlenecks].sort((a, b) => {
            const severityDiff =
                (this.impactOrder[b.severity] || 0) - (this.impactOrder[a.severity] || 0);
            if (severityDiff !== 0)
                return severityDiff;

            const timeA = a.timeToFailure ?? Infinity;
            const timeB = b.timeToFailure ?? Infinity;
            return timeA - timeB;
        });
    }

    groupBySeverity(bottlenecks: BottleneckInfo[]): Record<Severity, BottleneckInfo[]> {
        const grouped: Record<Severity, BottleneckInfo[]> = {
            critical: [],
            high: [],
            medium: [],
            low: [],
        };

        bottlenecks.forEach((b) => {
            grouped[b.severity].push(b);
        });

        return grouped;
    }

    topCritical(bottlenecks: BottleneckInfo[], n = 3): BottleneckInfo[] {
        return this.rankBottlenecks(bottlenecks).slice(0, n);
    }

    calculateRiskScore(bottlenecks: BottleneckInfo[]): number {
        if (bottlenecks.length === 0) return 0;

        let score = 0;
        bottlenecks.forEach((b) => {
            score += this.impactOrder[b.severity] * 10;

            if (b.timeToFailure !== undefined) {
                if (b.timeToFailure < 10) score += 20;
                else if (b.timeToFailure < 60) score += 10;
                else if (b.timeToFailure < 300) score += 5;
            }
        });

        return Math.min(100, score);
    }
}