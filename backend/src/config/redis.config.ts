export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryAttempts: 3,
    retryDelay: 1000,
    ttl: {
        short: 60, // 1 minute
        medium: 300, // 5 minutes
        long: 3600, // 1 hour
        day: 86400, // 24 hours
    },
    keyPrefix: 'atlaso:',
};

export type RedisConfig = typeof redisConfig;