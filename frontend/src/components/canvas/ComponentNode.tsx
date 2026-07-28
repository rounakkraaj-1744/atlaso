import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CanvasNode } from '../../types';
import { ComponentIconRenderer } from './ComponentIconRenderer';
import { NodeDetailPopover } from './NodeDetailPopover';
import { componentRegistry } from '../../features/registry/data/components';
import { AlertTriangle, CheckCircle2, Copy, FileText, Layers3, MoreVertical, PencilLine, Trash2, X, XCircle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: 'text-slate-400',
    bg: 'bg-[#09090b]/95',
    border: 'border-white/10',
    glow: 'shadow-none',
    indicator: 'bg-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.1)]',
    indicator: 'bg-yellow-400',
  },
  bottleneck: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/50',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    indicator: 'bg-orange-400',
  },
  overloaded: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    indicator: 'bg-red-400',
  },
};

const domainBorderColors: Record<string, string> = {
  compute: 'border-blue-500/50',
  databases: 'border-emerald-500/50',
  networking: 'border-purple-500/50',
  storage: 'border-orange-500/50',
  messaging: 'border-pink-500/50',
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
  onOpenReplaceTechnology?: (node: CanvasNode) => void;
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
  onOpenReplaceTechnology,
}: ComponentNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailPopover, setShowDetailPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
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
  const providerLabel = node.providerMapping?.technology || node.config.name;
  const provider = node.providerMapping?.provider;

  const subtitleTone = useMemo(() => {
    if (provider === 'AWS') return 'text-amber-300';
    if (provider === 'Azure') return 'text-sky-300';
    if (provider === 'Google Cloud') return 'text-blue-300';
    if (provider === 'Cloudflare') return 'text-orange-300';
    if (provider === 'Civo') return 'text-emerald-300';
    if (node.providerMapping?.mappingStatus === 'manual' || node.providerMapping?.mappingStatus === 'custom') return 'text-emerald-300';
    return 'text-slate-500';
  }, [node.providerMapping?.mappingStatus, provider]);

  // Can this node be a connection target?
  const canBeTarget = isConnecting && connectionSource && connectionSource !== node.id;

  const domainBorder = node.status === 'healthy' && registryItem?.domain 
    ? (domainBorderColors[registryItem.domain] || status.border) 
    : status.border;

  return (
    <>
      {contextMenu &&
        createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[115]" onClick={() => setContextMenu(null)} onContextMenu={() => setContextMenu(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -2 }}
                transition={{ duration: 0.16 }}
                className="fixed z-[116] w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f16]/95 shadow-2xl backdrop-blur-2xl"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
              >
                <button onClick={() => { setContextMenu(null); onOpenReplaceTechnology?.(node); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5">
                  <Layers3 className="h-4 w-4 text-blue-400" />
                  Replace Technology...
                </button>
                <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/5">
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/5">
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/5">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <div className="my-1 h-px bg-white/5" />
                <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/5">
                  <FileText className="h-4 w-4" />
                  Documentation
                </button>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
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
        className={`relative ${status.bg} backdrop-blur-xl border-2 ${domainBorder} rounded-xl ${isDragging ? '' : 'transition-all'} ${isDragging ? 'opacity-70 shadow-2xl scale-105' : ''
          } ${node.status === 'bottleneck' || node.status === 'overloaded'
            ? 'animate-pulse-slow ' + status.glow
            : 'shadow-lg hover:shadow-xl'
          } ${isHighlighted ? 'ring-2 ring-blue-500/50' : ''} ${canBeTarget ? 'ring-2 ring-green-400/50' : ''}`}
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

        <div className={`px-3 py-2.5 rounded-xl min-w-[220px]`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {registryItem && (
                <ComponentIconRenderer
                  type={registryItem.type}
                  vendor={registryItem.vendor}
                  size={24}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-slate-200 truncate text-xs tracking-tight">
                {node.config.name}
              </h3>
              {registryItem && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={cn('text-[10px] truncate', subtitleTone)}>
                    {providerLabel}
                  </span>
                  {node.providerMapping?.mappingStatus && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                      {node.providerMapping.mappingStatus === 'manual' ? 'Manual' : 'Custom'}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 self-start pt-1">
              {onOpenReplaceTechnology && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReplaceTechnology(node);
                  }}
                  className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                  title="Replace technology"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                </button>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${status.indicator} shadow-[0_0_5px_currentColor]`} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                title="Actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
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
          className={`connection-port absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-white/10 transition-all cursor-pointer z-10 flex items-center justify-center
            ${canBeTarget
              ? 'bg-green-500/20 border-green-400/50 scale-125 shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'bg-slate-900 hover:bg-slate-800 hover:border-slate-500'}`}
          onClick={(e) => handlePortClick(e, 'left')}
          title={canBeTarget ? 'Click to connect here' : 'Input port'}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${canBeTarget ? 'bg-green-400' : 'bg-slate-600'}`} />
        </div>

        {/* Right port - output (source for connections) */}
        <div
          className={`connection-port absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-white/10 transition-all cursor-pointer z-10 flex items-center justify-center
            ${isConnecting && connectionSource === node.id
              ? 'bg-blue-500/20 border-blue-400/50 scale-125 shadow-[0_0_10px_rgba(96,165,250,0.3)]'
              : 'bg-slate-900 hover:bg-slate-800 hover:border-slate-500'}`}
          onClick={(e) => handlePortClick(e, 'right')}
          title="Click to start connection"
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isConnecting && connectionSource === node.id ? 'bg-blue-400' : 'bg-slate-600'}`} />
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
