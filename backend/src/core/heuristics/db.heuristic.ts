/**
 * Database Heuristics - Scaling and performance patterns for databases
 */

export interface DbHeuristic {
    type: 'postgresql' | 'mongodb';
    connectionPoolDefault: number;
    maxConnectionsPerInstance: number;
    typicalP95LatencyMs: number;
    scalingPattern: 'vertical' | 'horizontal' | 'read-replica';
}

export const dbHeuristics: Record<string, DbHeuristic> = {
    postgresql: {
        type: 'postgresql',
        connectionPoolDefault: 100,
        maxConnectionsPerInstance: 500,
        typicalP95LatencyMs: 10,
        scalingPattern: 'vertical',
    },
    mongodb: {
        type: 'mongodb',
        connectionPoolDefault: 100,
        maxConnectionsPerInstance: 1000,
        typicalP95LatencyMs: 5,
        scalingPattern: 'horizontal',
    },
};

/**
 * Calculate recommended connection pool size
 */
export function recommendedPoolSize(
    avgRPS: number,
    avgLatencyMs: number,
): number {
    // Connections = RPS * (Latency / 1000)
    const needed = Math.ceil(avgRPS * (avgLatencyMs / 1000));
    return Math.min(Math.max(needed, 10), 500);
}

/**
 * Calculate expected throughput for database
 */
export function dbThroughput(
    connectionPool: number,
    avgLatencyMs: number,
): number {
    // Throughput = Pool Size / (Latency / 1000)
    return Math.floor(connectionPool / (avgLatencyMs / 1000));
}
