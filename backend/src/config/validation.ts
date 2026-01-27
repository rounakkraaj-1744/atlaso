export const validationConfig = {
    pipe: {
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    },

    rules: {
        name: {
            minLength: 1,
            maxLength: 100,
        },
        description: {
            maxLength: 1000,
        },
        architecture: {
            maxNodes: 100,
            maxEdges: 500,
        },
        throughput: {
            min: 1,
            max: 10000000,
        },
        latency: {
            min: 0,
            max: 60000,
        },
        scalingFactor: {
            min: 1,
            max: 1000,
        },
    },
};

export type ValidationConfig = typeof validationConfig;