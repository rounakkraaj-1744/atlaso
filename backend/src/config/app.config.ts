export const appConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },

    apiPrefix: 'api',

    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
    },

    pagination: {
        defaultPage: 1,
        defaultLimit: 20,
        maxLimit: 100,
    },
};

export type AppConfig = typeof appConfig;