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

// recommend connection pool size
export function recommendedPoolSize( avgRPS: number, avgLatencyMs: number ): number {
    // connections = RPS * (Latency / 1000)
    const needed = Math.ceil(avgRPS * (avgLatencyMs / 1000));
    return Math.min(Math.max(needed, 10), 500);
}

// calculate expected throughput for the database
export function dbThroughput( connectionPool: number, avgLatencyMs: number ): number {
    // throughput = pool size / (latency / 1000)
    return Math.floor(connectionPool / (avgLatencyMs / 1000));
}