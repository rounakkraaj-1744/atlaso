export const CacheKeys = {
    architecture: {
        byId: (id: string) => `architecture:${id}`,
        all: 'architectures:all',
        versions: (id: string) => `architecture:${id}:versions`,
    },

    registry: {
        all: 'registry:components',
        byKey: (key: string) => `registry:component:${key}`,
        byCategory: (category: string) => `registry:category:${category}`,
    },

    scenario: {
        byId: (id: string) => `scenario:${id}`,
        presets: 'scenarios:presets',
        all: 'scenarios:all',
    },

    evaluation: {
        byId: (id: string) => `evaluation:${id}`,
        byArchitecture: (archId: string) => `evaluations:architecture:${archId}`,
    },

    comparison: {
        byId: (id: string) => `comparison:${id}`,
    },
};

export type CacheKeyType = typeof CacheKeys;