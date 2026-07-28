export type Vendor = 'generic';
export type Domain = 'compute' | 'networking' | 'storage' | 'databases' | 'cache' | 'messaging' | 'security' | 'observability' | 'ai' | 'external' | 'analytics' | 'devops';
export type DataPattern = 'sync' | 'async' | 'batch' | 'stream' | 'realtime';
export type ComponentPack = 'core';

export interface ComponentRegistryItem {
    type: string;
    name: string;
    vendor: Vendor;
    domain: Domain;
    dataPatterns: DataPattern[];
    description: string;
    iconPath?: string;
    defaultThroughput: number;
    defaultLatency: number;
    isManaged: boolean;
    isControlPlane: boolean;
    pack: ComponentPack;
    tags: string[];
}

export interface ComponentRegistry {
    [key: string]: ComponentRegistryItem;
}
