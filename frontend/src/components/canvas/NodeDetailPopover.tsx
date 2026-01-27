import type { CanvasNode } from '../../types';
import { X, Settings } from 'lucide-react';

interface NodeDetailPopoverProps {
    node: CanvasNode;
    onClose: () => void;
    onEdit: () => void;
    position: { x: number; y: number };
}

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export function NodeDetailPopover({ node, onClose, onEdit, position }: NodeDetailPopoverProps) {
    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[90]"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed z-[100] w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <h3 className="font-medium text-sm text-slate-200">{node.config.name}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                </div>

                <div className="p-3 space-y-3">
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Capacity
                        </div>
                        <div className="space-y-1 bg-black/20 rounded-lg p-2 border border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Throughput</span>
                                <span className="font-mono text-slate-200">
                                    {(node.config.throughput * node.config.scalingFactor).toLocaleString()} rps
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Latency</span>
                                <span className="font-mono text-slate-200">{node.config.latency}ms</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Replicas</span>
                                <span className="font-mono text-slate-200">{node.config.scalingFactor}x</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase">Scale Mode</div>
                            <div className="text-xs text-slate-300 mt-0.5 truncate">
                                {node.config.scalingFactor === 1 ? 'Single' : 'Horizontal'}
                            </div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase">Failure</div>
                            <div className="text-xs text-slate-300 mt-0.5 truncate">
                                {node.config.failureBehavior}
                            </div>
                        </div>
                    </div>

                    {/* Edit Button */}
                    <button
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-200 text-xs font-medium transition-colors"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Edit Configuration
                    </button>
                </div>
            </motion.div>
        </>,
        document.body
    );
}