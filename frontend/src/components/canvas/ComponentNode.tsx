import { useDrag } from 'react-dnd';
import { CanvasNode } from '../../types';
import { ComponentIconRenderer } from './ComponentIconRenderer';
import { componentRegistry } from '../../data/componentRegistry';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Zap,
  X,
} from 'lucide-react';
import { ComponentType } from '../../types';

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  bottleneck: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/30',
  },
  overloaded: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/40',
  },
};

interface ComponentNodeProps {
  node: CanvasNode;
  onClick: () => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDelete?: (id: string) => void;
  scale: number;
}

export function ComponentNode({ node, onClick, onPositionChange, onDelete, scale }: ComponentNodeProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NODE',
    item: { id: node.id, position: node.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        // Completely free movement without any constraints
        const newX = item.position.x + delta.x / scale;
        const newY = item.position.y + delta.y / scale;
        onPositionChange(node.id, { x: newX, y: newY });
      }
    },
  }));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(node.id);
    }
  };

  const registryItem = componentRegistry[node.type];
  const status = statusConfig[node.status];
  const StatusIcon = status.icon;

  // Calculate utilization percentage
  const utilization = Math.min(100, (node.config.throughput / (registryItem?.defaultThroughput || 1)) * 100);
  const isHighUtilization = utilization > 80;

  return (
    <div
      ref={drag as any}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`relative w-72 bg-slate-800 border-2 ${status.border} rounded-lg transition-all ${isDragging ? 'opacity-50' : ''
        } ${node.status === 'bottleneck' || node.status === 'overloaded' ? 'animate-pulse-slow shadow-xl ' + status.glow : 'shadow-lg hover:shadow-xl'}`}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
          title="Delete component"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}
      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-700/50 ${status.bg}`}>
        <div className="flex items-center gap-3">
          <div>
            {registryItem && (
              <ComponentIconRenderer
                type={registryItem.type}
                vendor={registryItem.vendor}
                size={24}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-200 truncate">{node.config.name}</h3>
            {registryItem && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500">{registryItem.vendor.toUpperCase()}</span>
                {registryItem.isManaged && (
                  <span className="px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] rounded uppercase tracking-wide">
                    Managed
                  </span>
                )}
                {registryItem.isControlPlane && (
                  <span className="px-1 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[9px] rounded uppercase tracking-wide">
                    Control
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
            {isHighUtilization && (
              <Zap className="w-4 h-4 text-yellow-400" title="High utilization" />
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Throughput</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-300">
              {(node.config.throughput * node.config.scalingFactor).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">rps</span>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isHighUtilization ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 w-10 text-right">{Math.round(utilization)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Latency p95</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-300">{node.config.latency}</span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Scale Factor</span>
          <span className="text-sm font-mono text-slate-300">{node.config.scalingFactor}x</span>
        </div>
      </div>

      {/* Connection points */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 opacity-0 hover:opacity-100 transition-opacity cursor-crosshair"></div>
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 opacity-0 hover:opacity-100 transition-opacity cursor-crosshair"></div>
    </div>
  );
}