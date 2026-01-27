import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { cn } from '../../../lib/utils';
import type { NodeStatus } from '../../../types';

interface BaseNodeData extends Record<string, unknown> {
    label: string;
    status: NodeStatus;
    throughput?: number;
    latency?: number;
}

export const BaseNode = memo(({ data, selected }: NodeProps<Node<BaseNodeData>>) => {
    const statusColors = {
        healthy: 'border-accent-green/50 bg-accent-green/10',
        warning: 'border-accent-yellow/50 bg-accent-yellow/10',
        bottleneck: 'border-orange-500/50 bg-orange-500/10',
        overloaded: 'border-accent-red/50 bg-accent-red/10',
    };

    const statusIndicators = {
        healthy: 'bg-accent-green',
        warning: 'bg-accent-yellow',
        bottleneck: 'bg-orange-500 animate-pulse',
        overloaded: 'bg-accent-red animate-pulse',
    };

    return (
        <div
            className={cn(
                'px-4 py-3 rounded-lg border-2 bg-bg-secondary min-w-[180px]',
                'transition-all duration-200',
                statusColors[data.status],
                selected && 'ring-2 ring-accent-blue ring-offset-2 ring-offset-bg-primary'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-accent-blue border-2 border-bg-primary"
            />

            <div className="flex items-start gap-2">
                <div className={cn('w-2 h-2 rounded-full mt-1.5', statusIndicators[data.status])} />
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-text-primary truncate">
                        {data.label}
                    </div>
                    {(data.throughput || data.latency) && (
                        <div className="mt-1 space-y-0.5">
                            {data.throughput && (
                                <div className="text-xs text-text-secondary font-mono">
                                    {data.throughput.toLocaleString()} rps
                                </div>
                            )}
                            {data.latency && (
                                <div className="text-xs text-text-secondary font-mono">
                                    p95: {data.latency}ms
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-accent-blue border-2 border-bg-primary"
            />
        </div>
    );
});

BaseNode.displayName = 'BaseNode';
