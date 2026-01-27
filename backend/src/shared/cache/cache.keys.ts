/**
 * Cache Keys - Centralized cache key management
 */

export const CacheKeys = {
    // Architecture keys
    architecture: {
        byId: (id: string) => `architecture:${id}`,
        all: 'architectures:all',
        versions: (id: string) => `architecture:${id}:versions`,
    },

    // Component registry keys
    registry: {
        all: 'registry:components',
        byKey: (key: string) => `registry:component:${key}`,
        byCategory: (category: string) => `registry:category:${category}`,
    },

    // Scenario keys
    scenario: {
        byId: (id: string) => `scenario:${id}`,
        presets: 'scenarios:presets',
        all: 'scenarios:all',
    },

    // Evaluation keys
    evaluation: {
        byId: (id: string) => `evaluation:${id}`,
        byArchitecture: (archId: string) => `evaluations:architecture:${archId}`,
    },

    // Comparison keys
    comparison: {
        byId: (id: string) => `comparison:${id}`,
    },
};

export type CacheKeyType = typeof CacheKeys;
