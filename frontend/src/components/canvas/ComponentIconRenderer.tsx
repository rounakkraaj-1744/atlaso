import {
  Server,
  Database,
  Cloud,
  Network,
  Cpu,
  HardDrive,
  Workflow,
  Activity,
  BarChart3,
  Globe,
  Layers,
  Box,
} from 'lucide-react';
import { Vendor } from '../../types/registry';

interface ComponentIconRendererProps {
  type: string;
  vendor: Vendor;
  size?: number;
  className?: string;
}

/**
 * Renders component icons with vendor-specific styling
 * In production, this would load actual SVG icons from vendor asset libraries
 */
export function ComponentIconRenderer({ type, vendor, size = 20, className = '' }: ComponentIconRendererProps) {
  const iconProps = {
    width: size,
    height: size,
    className: `${className} ${getVendorColor(vendor)}`,
  };

  // Icon mapping based on component type
  const Icon = getIconComponent(type);

  return (
    <div className={`p-1.5 rounded ${getVendorBgColor(vendor)} ${getVendorBorderColor(vendor)} border`}>
      <Icon {...iconProps} />
    </div>
  );
}

function getIconComponent(type: string) {
  // AWS
  if (type.includes('lambda') || type.includes('functions')) return Cpu;
  if (type.includes('alb') || type.includes('nlb') || type.includes('gateway')) return Network;
  if (type.includes('cloudfront') || type.includes('cdn') || type.includes('front-door')) return Cloud;
  if (type.includes('ecs') || type.includes('eks') || type.includes('gke') || type.includes('aks') || type.includes('container')) return Box;
  if (type.includes('sqs') || type.includes('sns') || type.includes('service-bus')) return Workflow;
  if (type.includes('kinesis') || type.includes('kafka') || type.includes('pub-sub') || type.includes('event')) return Activity;
  if (type.includes('redis') || type.includes('cache') || type.includes('memorystore')) return Database;
  if (type.includes('rds') || type.includes('sql') || type.includes('postgres') || type.includes('dynamodb') || type.includes('cosmos') || type.includes('firestore') || type.includes('mongodb')) return Database;
  if (type.includes('s3') || type.includes('storage') || type.includes('blob')) return HardDrive;
  if (type.includes('prometheus') || type.includes('grafana')) return BarChart3;
  if (type.includes('nginx') || type.includes('haproxy') || type.includes('load-balancing')) return Network;
  if (type.includes('elasticsearch')) return BarChart3;
  if (type.includes('rabbitmq')) return Workflow;

  return Server;
}

function getVendorColor(vendor: Vendor): string {
  switch (vendor) {
    case 'aws':
      return 'text-orange-400';
    case 'gcp':
      return 'text-blue-400';
    case 'azure':
      return 'text-sky-400';
    case 'oss':
    case 'apache':
      return 'text-slate-300';
    default:
      return 'text-slate-400';
  }
}

function getVendorBgColor(vendor: Vendor): string {
  switch (vendor) {
    case 'aws':
      return 'bg-orange-500/10';
    case 'gcp':
      return 'bg-blue-500/10';
    case 'azure':
      return 'bg-sky-500/10';
    case 'oss':
    case 'apache':
      return 'bg-slate-700/30';
    default:
      return 'bg-slate-700/20';
  }
}

function getVendorBorderColor(vendor: Vendor): string {
  switch (vendor) {
    case 'aws':
      return 'border-orange-500/30';
    case 'gcp':
      return 'border-blue-500/30';
    case 'azure':
      return 'border-sky-500/30';
    case 'oss':
    case 'apache':
      return 'border-slate-600/50';
    default:
      return 'border-slate-600/30';
  }
}
