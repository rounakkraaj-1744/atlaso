/**
 * Redis Configuration
 */

export const redisConfig = {
    // Redis connection
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),

    // Connection settings
    retryAttempts: 3,
    retryDelay: 1000, // 1 second

    // Cache TTL defaults (in seconds)
    ttl: {
        short: 60, // 1 minute
        medium: 300, // 5 minutes
        long: 3600, // 1 hour
        day: 86400, // 24 hours
    },

    // Key prefixes
    keyPrefix: 'atlaso:',
};

export type RedisConfig = typeof redisConfig;
