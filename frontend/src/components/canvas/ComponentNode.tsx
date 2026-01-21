import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { CanvasNode } from '../../types';
import { ComponentIconRenderer } from './ComponentIconRenderer';
import { NodeDetailPopover } from './NodeDetailPopover';
import { componentRegistry } from '../../data/componentRegistry';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { ComponentType } from '../../types';

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    indicator: 'bg-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
    indicator: 'bg-yellow-400',
  },
  bottleneck: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/30',
    indicator: 'bg-orange-400',
  },
  overloaded: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/40',
    indicator: 'bg-red-400',
  },
};

interface ComponentNodeProps {
  node: CanvasNode;
  onClick: () => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDelete?: (id: string) => void;
  scale: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  showInlineExplanation?: boolean;
  inlineExplanation?: string;
}

export function ComponentNode({
  node,
  onClick,
  onPositionChange,
  onDelete,
  scale,
  isHighlighted = false,
  isDimmed = false,
  showInlineExplanation = false,
  inlineExplanation,
}: ComponentNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailPopover, setShowDetailPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NODE',
    item: { id: node.id, position: node.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      x: rect.right + 10,
      y: rect.top,
    });
    setShowDetailPopover(true);
    onClick();
  };

  const registryItem = componentRegistry[node.type];
  const status = statusConfig[node.status];
  const StatusIcon = status.icon;

  const effectiveThroughput = node.config.throughput * node.config.scalingFactor;

  return (
    <>
      <div
        ref={drag as any}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDimmed ? 0.3 : 1,
          transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
        }}
        className={`relative bg-slate-800 border-2 ${status.border} rounded-lg transition-all ${isDragging ? 'opacity-50' : ''
          } ${node.status === 'bottleneck' || node.status === 'overloaded'
            ? 'animate-pulse-slow shadow-xl ' + status.glow
            : 'shadow-lg hover:shadow-xl'
          } ${isHighlighted ? 'ring-4 ring-blue-500/50' : ''}`}
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

        {/* DEFAULT VIEW: Minimal - Icon, Name, Status */}
        <div className={`px-4 py-3 ${status.bg} rounded-lg`}>
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
              <h3 className="font-medium text-slate-200 truncate text-sm">
                {node.config.name}
              </h3>
              {registryItem && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500">
                    {registryItem.vendor.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Status Indicator Dot */}
              <div className={`w-2 h-2 rounded-full ${status.indicator}`} />
            </div>
          </div>

          {/* HOVER STATE: Show throughput hint */}
          {isHovered && (
            <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ArrowRight className="w-3 h-3" />
                <span className="font-mono">{effectiveThroughput.toLocaleString()} rps</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Click for details
              </div>
            </div>
          )}
        </div>

        {/* Inline Explanation (for bottlenecks) */}
        {showInlineExplanation && inlineExplanation && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-slate-900 border border-red-500/50 rounded text-xs text-slate-300 leading-relaxed shadow-xl z-20">
            {inlineExplanation}
          </div>
        )}

        {/* Connection points */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 opacity-0 hover:opacity-100 transition-opacity cursor-crosshair" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 opacity-0 hover:opacity-100 transition-opacity cursor-crosshair" />
      </div>

      {/* Detail Popover (CLICK STATE) */}
      {showDetailPopover && (
        <NodeDetailPopover
          node={node}
          onClose={() => setShowDetailPopover(false)}
          onEdit={onClick}
          position={popoverPosition}
        />
      )}
    </>
  );
}