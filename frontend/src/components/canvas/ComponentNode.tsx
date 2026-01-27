import { useState, useEffect } from 'react';
import type { CanvasNode } from '../../types';
import { ComponentIconRenderer } from './ComponentIconRenderer';
import { NodeDetailPopover } from './NodeDetailPopover';
import { componentRegistry } from '../../features/registry/data/components';
import { AlertTriangle, CheckCircle2, XCircle, X, ArrowRight } from 'lucide-react';

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
  // Connection props
  onStartConnection?: (nodeId: string, side: 'left' | 'right') => void;
  onEndConnection?: (nodeId: string) => void;
  isConnecting?: boolean;
  connectionSource?: string | null;
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
  onStartConnection,
  onEndConnection,
  isConnecting = false,
  connectionSource,
}: ComponentNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailPopover, setShowDetailPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(node.position);
  const [hasDragged, setHasDragged] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setCurrentPosition(node.position);
    }
  }, [node.position, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.connection-port'))
      return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setHasDragged(false);
    setDragStart({
      x: e.clientX - currentPosition.x * scale,
      y: e.clientY - currentPosition.y * scale,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragStart.x) / scale;
      const newY = (e.clientY - dragStart.y) / scale;

      const deltaX = Math.abs(newX - currentPosition.x);
      const deltaY = Math.abs(newY - currentPosition.y);
      if (deltaX > 5 || deltaY > 5) {
        setHasDragged(true);
      }

      setCurrentPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onPositionChange(node.id, currentPosition);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, node.id, currentPosition, onPositionChange]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete)
      onDelete(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged)
      return;

    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      x: rect.right + 10,
      y: rect.top,
    });
    setShowDetailPopover(true);
    onClick();
  };

  const handlePortClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();

    if (isConnecting && connectionSource && connectionSource !== node.id) {
      // Complete the connection
      onEndConnection?.(node.id);
    } else if (!isConnecting && side === 'right') {
      // Start a new connection (only from right port)
      onStartConnection?.(node.id, side);
    }
  };

  const registryItem = componentRegistry[node.type];
  const status = statusConfig[node.status];
  const effectiveThroughput = node.config.throughput * node.config.scalingFactor;

  // Can this node be a connection target?
  const canBeTarget = isConnecting && connectionSource && connectionSource !== node.id;

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          left: currentPosition.x,
          top: currentPosition.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDimmed ? 0.3 : 1,
          transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
          userSelect: 'none',
        }}
        className={`relative bg-slate-800 border-2 ${status.border} rounded-lg ${isDragging ? '' : 'transition-all'} ${isDragging ? 'opacity-70 shadow-2xl' : ''
          } ${node.status === 'bottleneck' || node.status === 'overloaded'
            ? 'animate-pulse-slow shadow-xl ' + status.glow
            : 'shadow-lg hover:shadow-xl'
          } ${isHighlighted ? 'ring-4 ring-blue-500/50' : ''} ${canBeTarget ? 'ring-2 ring-green-400/50' : ''}`}
      >
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
            title="Delete component"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}

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
              <div className={`w-2 h-2 rounded-full ${status.indicator}`} />
            </div>
          </div>

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

        {showInlineExplanation && inlineExplanation && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-slate-900 border border-red-500/50 rounded text-xs text-slate-300 leading-relaxed shadow-xl z-20">
            {inlineExplanation}
          </div>
        )}

        {/* Left port - input (target for connections) */}
        <div
          className={`connection-port absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all cursor-pointer z-10 flex items-center justify-center
            ${canBeTarget
              ? 'bg-green-400 border-green-300 scale-125 shadow-lg shadow-green-400/50'
              : 'bg-slate-600 border-slate-500 hover:bg-blue-500 hover:border-blue-400 hover:scale-110'}`}
          onClick={(e) => handlePortClick(e, 'left')}
          title={canBeTarget ? 'Click to connect here' : 'Input port'}
        >
          <div className="w-2 h-2 rounded-full bg-slate-400" />
        </div>

        {/* Right port - output (source for connections) */}
        <div
          className={`connection-port absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all cursor-pointer z-10 flex items-center justify-center
            ${isConnecting && connectionSource === node.id
              ? 'bg-yellow-400 border-yellow-300 scale-125 shadow-lg shadow-yellow-400/50'
              : 'bg-slate-600 border-slate-500 hover:bg-blue-500 hover:border-blue-400 hover:scale-110'}`}
          onClick={(e) => handlePortClick(e, 'right')}
          title="Click to start connection"
        >
          <div className="w-2 h-2 rounded-full bg-slate-400" />
        </div>
      </div>

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
