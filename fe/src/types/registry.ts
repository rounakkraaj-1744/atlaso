export type Vendor = 'aws' | 'gcp' | 'azure' | 'oss' | 'apache' | 'hashicorp' | 'confluent';
export type Domain = 'messaging' | 'storage' | 'compute' | 'networking' | 'observability' | 'security' | 'analytics';
export type DataPattern = 'sync' | 'async' | 'batch' | 'stream' | 'realtime';
export type ComponentPack = 'aws' | 'gcp' | 'azure' | 'oss';

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
