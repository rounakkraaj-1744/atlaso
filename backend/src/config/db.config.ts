export const dbConfig = {
    url: process.env.DATABASE_URL,

    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 10000,
    },

    query: {
        timeout: 30000,
        retries: 3,
    },

    logging: process.env.NODE_ENV !== 'production',
};

export type DbConfig = typeof dbConfig;