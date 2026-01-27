/**
 * Ranking Service - Rank suggestions and bottlenecks by impact
 */

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

    /**
     * Rank suggestions by impact (highest first)
     */
    rankSuggestions(suggestions: Suggestion[]): Suggestion[] {
        return [...suggestions].sort(
            (a, b) =>
                (this.impactOrder[b.impact] || 0) - (this.impactOrder[a.impact] || 0),
        );
    }

    /**
     * Rank bottlenecks by severity and time to failure
     */
    rankBottlenecks(bottlenecks: BottleneckInfo[]): BottleneckInfo[] {
        return [...bottlenecks].sort((a, b) => {
            // First by severity
            const severityDiff =
                (this.impactOrder[b.severity] || 0) - (this.impactOrder[a.severity] || 0);
            if (severityDiff !== 0) return severityDiff;

            // Then by time to failure (soonest first)
            const timeA = a.timeToFailure ?? Infinity;
            const timeB = b.timeToFailure ?? Infinity;
            return timeA - timeB;
        });
    }

    /**
     * Group bottlenecks by severity
     */
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

    /**
     * Get top N most critical issues
     */
    topCritical(bottlenecks: BottleneckInfo[], n = 3): BottleneckInfo[] {
        return this.rankBottlenecks(bottlenecks).slice(0, n);
    }

    /**
     * Calculate overall risk score (0-100)
     */
    calculateRiskScore(bottlenecks: BottleneckInfo[]): number {
        if (bottlenecks.length === 0) return 0;

        let score = 0;
        bottlenecks.forEach((b) => {
            score += this.impactOrder[b.severity] * 10;

            // Add urgency factor for time to failure
            if (b.timeToFailure !== undefined) {
                if (b.timeToFailure < 10) score += 20;
                else if (b.timeToFailure < 60) score += 10;
                else if (b.timeToFailure < 300) score += 5;
            }
        });

        return Math.min(100, score);
    }
}
