import { useState } from 'react';
import type { CanvasNode } from '../../types';
import { X, TrendingUp, Clock, Zap, Settings } from 'lucide-react';

interface NodeDetailPopoverProps {
    node: CanvasNode;
    onClose: () => void;
    onEdit: () => void;
    position: { x: number; y: number };
}

export function NodeDetailPopover({ node, onClose, onEdit, position }: NodeDetailPopoverProps) {
    return (
        <>
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            <div
                className="fixed z-50 w-80 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-2xl"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <h3 className="font-semibold text-slate-200">{node.config.name}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Capacity Assumptions
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Throughput</span>
                                <span className="font-mono text-slate-300">
                                    {(node.config.throughput * node.config.scalingFactor).toLocaleString()} rps
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">p95 Latency</span>
                                <span className="font-mono text-slate-300">{node.config.latency}ms</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Scaling Factor</span>
                                <span className="font-mono text-slate-300">{node.config.scalingFactor}x</span>
                            </div>
                        </div>
                    </div>

                    {/* Scaling Behavior */}
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Scaling Behavior
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {node.config.scalingFactor === 1
                                ? 'Single instance. No horizontal scaling configured.'
                                : `Horizontally scaled to ${node.config.scalingFactor} instances. Load distributed across replicas.`}
                        </p>
                    </div>

                    {/* Failure Mode */}
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Failure Behavior
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {node.config.failureBehavior === 'retry'
                                ? 'Retries failed requests with exponential backoff.'
                                : node.config.failureBehavior === 'circuit-breaker'
                                    ? 'Circuit breaker opens after threshold failures.'
                                    : 'Fails fast without retry.'}
                        </p>
                    </div>

                    {/* Notes */}
                    {node.config.notes && (
                        <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                Notes
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{node.config.notes}</p>
                        </div>
                    )}

                    {/* Edit Button */}
                    <button
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Edit Configuration
                    </button>
                </div>
            </div>
        </>
    );
}