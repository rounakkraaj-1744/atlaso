/**
 * Database Configuration
 */

export const dbConfig = {
    // Database URL from environment
    url: process.env.DATABASE_URL,

    // Connection pool settings
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 10000,
    },

    // Query settings
    query: {
        timeout: 30000, // 30 seconds
        retries: 3,
    },

    // Logging
    logging: process.env.NODE_ENV !== 'production',
};

export type DbConfig = typeof dbConfig;
