/**
 * Validation Configuration
 */

export const validationConfig = {
    // Validation pipe options
    pipe: {
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    },

    // Custom validation rules
    rules: {
        // Name constraints
        name: {
            minLength: 1,
            maxLength: 100,
        },

        // Description constraints
        description: {
            maxLength: 1000,
        },

        // Architecture constraints
        architecture: {
            maxNodes: 100,
            maxEdges: 500,
        },

        // Throughput constraints
        throughput: {
            min: 1,
            max: 10000000, // 10M rps
        },

        // Latency constraints
        latency: {
            min: 0,
            max: 60000, // 60 seconds
        },

        // Scaling factor constraints
        scalingFactor: {
            min: 1,
            max: 1000,
        },
    },
};

export type ValidationConfig = typeof validationConfig;
