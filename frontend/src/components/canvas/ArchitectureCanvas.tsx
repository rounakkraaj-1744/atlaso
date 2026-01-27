import { useRef, useState, useCallback, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ComponentNode } from './ComponentNode';
import { NodeConfigDrawer } from './NodeConfigDrawer';
import { ConnectionDrawer } from './ConnectionDrawer';
import { Minimap } from './Minimap';
import type { CanvasNode, ComponentType, Connection } from '../../types';
import { componentRegistry } from '../../features/registry/data/components';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface CanvasProps {
    nodes: CanvasNode[];
    connections: Connection[];
    onAddNode: (node: CanvasNode) => void;
    onUpdateNode: (node: CanvasNode) => void;
    onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
    onDeleteNode?: (nodeId: string) => void;
    onDuplicateNode?: (nodeId: string) => void;
    onUpdateConnection?: (connection: Connection) => void;
    onDeleteConnection?: (connectionId: string) => void;
    onAddConnection?: (connection: Connection) => void;
}

export function Canvas({
    nodes,
    connections,
    onAddNode,
    onUpdateNode,
    onNodePositionChange,
    onDeleteNode,
    onDuplicateNode,
    onUpdateConnection,
    onDeleteConnection,
    onAddConnection,
}: CanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

    // Connection creation state
    const [connectionSource, setConnectionSource] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Track mouse position for connection preview line
    useEffect(() => {
        if (!isConnecting) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left - pan.x) / scale;
                const y = (e.clientY - rect.top - pan.y) / scale;
                setMousePos({ x, y });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isConnecting, pan, scale]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNode && onDeleteNode) {
                    onDeleteNode(selectedNode.id);
                    setSelectedNode(null);
                }
                if (selectedConnection && onDeleteConnection) {
                    onDeleteConnection(selectedConnection.id);
                    setSelectedConnection(null);
                }
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                if (selectedNode && onDuplicateNode) {
                    onDuplicateNode(selectedNode.id);
                }
            }

            if (e.key === 'Escape') {
                setSelectedNode(null);
                setSelectedConnection(null);
                setIsConnecting(false);
                setConnectionSource(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, selectedConnection, onDeleteNode, onDeleteConnection, onDuplicateNode]);

    const handleStartConnection = useCallback((nodeId: string) => {
        setConnectionSource(nodeId);
        setIsConnecting(true);
        const sourceNode = nodes.find(n => n.id === nodeId);
        if (sourceNode) {
            setMousePos({
                x: sourceNode.position.x + 128,
                y: sourceNode.position.y + 40
            });
        }
    }, [nodes]);

    const handleEndConnection = useCallback((targetNodeId: string) => {
        if (connectionSource && connectionSource !== targetNodeId && onAddConnection) {
            const exists = connections.some(
                (c) => c.sourceId === connectionSource && c.targetId === targetNodeId
            );

            if (!exists) {
                const newConnection: Connection = {
                    id: `conn-${Date.now()}`,
                    sourceId: connectionSource,
                    targetId: targetNodeId,
                    type: 'sync',
                    hasRetry: false,
                    hasBuffer: false,
                };
                onAddConnection(newConnection);
            }
        }
        setIsConnecting(false);
        setConnectionSource(null);
    }, [connectionSource, connections, onAddConnection]);

    const handleCanvasClick = useCallback(() => {
        if (isConnecting) {
            setIsConnecting(false);
            setConnectionSource(null);
        }
    }, [isConnecting]);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: (item: { componentType: ComponentType }, monitor) => {
            const offset = monitor.getClientOffset();
            if (!offset || !canvasRef.current) return;

            const rect = canvasRef.current.getBoundingClientRect();
            const x = (offset.x - rect.left - pan.x) / scale;
            const y = (offset.y - rect.top - pan.y) / scale;

            const definition = componentRegistry[item.componentType];
            if (!definition) return;

            const newNode: CanvasNode = {
                id: `node-${Date.now()}`,
                type: item.componentType,
                position: { x, y },
                config: {
                    name: definition.name,
                    throughput: definition.defaultThroughput,
                    latency: definition.defaultLatency,
                    scalingFactor: 1,
                    failureBehavior: 'retry',
                    notes: '',
                },
                status: 'healthy',
            };

            onAddNode(newNode);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => Math.min(Math.max(prev * delta, 0.25), 2));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 2));
    const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.25));
    const handleResetView = () => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    };

    const handleConnectionClick = (conn: Connection) => {
        setSelectedConnection(conn);
        setSelectedNode(null);
    };

    const getSourcePosition = () => {
        if (!connectionSource) return null;
        const sourceNode = nodes.find(n => n.id === connectionSource);
        if (!sourceNode) return null;
        return {
            x: sourceNode.position.x + 128,
            y: sourceNode.position.y + 40,
        };
    };

    const renderConnections = () => {
        return connections.map((conn) => {
            const source = nodes.find((n) => n.id === conn.sourceId);
            const target = nodes.find((n) => n.id === conn.targetId);
            if (!source || !target) return null;

            const x1 = source.position.x + 128;
            const y1 = source.position.y + 40;
            const x2 = target.position.x;
            const y2 = target.position.y + 40;

            const isSelected = selectedConnection?.id === conn.id;
            const strokeColor = conn.type === 'async' ? '#3b82f6' : '#8b5cf6';

            return (
                <g key={conn.id} style={{ cursor: 'pointer' }} onClick={() => handleConnectionClick(conn)}>
                    <path
                        d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                        stroke="transparent"
                        strokeWidth="20"
                        fill="none"
                    />
                    <path
                        d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                        stroke={isSelected ? '#fbbf24' : strokeColor}
                        strokeWidth={isSelected ? 3 : 2}
                        fill="none"
                        strokeDasharray={conn.type === 'async' ? '5,5' : '0'}
                        opacity={isSelected ? 1 : 0.7}
                    />
                    <circle cx={x2} cy={y2} r={isSelected ? 6 : 4} fill={isSelected ? '#fbbf24' : strokeColor} />
                    {conn.hasRetry && (
                        <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="6" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
                    )}
                </g>
            );
        });
    };

    const renderConnectionPreview = () => {
        const sourcePos = getSourcePosition();
        if (!isConnecting || !sourcePos) return null;

        const x1 = sourcePos.x;
        const y1 = sourcePos.y;
        const x2 = mousePos.x;
        const y2 = mousePos.y;

        return (
            <g>
                <path
                    d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                    stroke="#22c55e"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="8,4"
                    opacity="0.8"
                />
                <circle cx={x2} cy={y2} r="8" fill="#22c55e" opacity="0.6" />
            </g>
        );
    };

    return (
        <>
            <div
                ref={(node) => {
                    drop(node);
                    if (node) canvasRef.current = node;
                }}
                className={`relative flex-1 h-full bg-slate-950 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'
                    } ${isOver ? 'bg-slate-900/50' : ''} ${isConnecting ? 'cursor-crosshair' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
            >
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, #1e293b 1px, transparent 1px),
              linear-gradient(to bottom, #1e293b 1px, transparent 1px)
            `,
                        backgroundSize: `${40 * scale}px ${40 * scale}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`,
                    }}
                />

                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                    }}
                    className="relative w-full h-full"
                >
                    <svg className="absolute inset-0 w-[5000px] h-[5000px]" style={{ pointerEvents: 'all' }}>
                        {renderConnections()}
                        {renderConnectionPreview()}
                    </svg>

                    {nodes.map((node) => (
                        <ComponentNode
                            key={node.id}
                            node={node}
                            onClick={() => setSelectedNode(node)}
                            onPositionChange={onNodePositionChange}
                            onDelete={onDeleteNode}
                            scale={scale}
                            onStartConnection={handleStartConnection}
                            onEndConnection={handleEndConnection}
                            isConnecting={isConnecting}
                            connectionSource={connectionSource}
                        />
                    ))}
                </div>

                {isConnecting && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 rounded-lg text-white text-sm font-medium shadow-lg z-50">
                        🔗 Click on another component to connect • ESC to cancel
                    </div>
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
                    <button
                        onClick={handleZoomIn}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-5 h-5 text-slate-300" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-5 h-5 text-slate-300" />
                    </button>
                    <button
                        onClick={handleResetView}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Reset View"
                    >
                        <Maximize2 className="w-5 h-5 text-slate-300" />
                    </button>
                </div>

                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center space-y-3">
                            <div className="text-slate-600 text-lg">Drag components from the left palette</div>
                            <div className="text-slate-700 text-sm">
                                Click right port to connect • Shift + Drag to pan • Scroll to zoom
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                    <span className="text-xs font-mono text-slate-400">{Math.round(scale * 100)}%</span>
                </div>

                {connections.length > 0 && (
                    <div className="absolute bottom-4 left-4 p-3 bg-slate-800 border border-slate-700 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Connections
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-purple-500"></div>
                            <span className="text-xs text-slate-400">Synchronous</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-blue-500 border-dashed" style={{ borderTopWidth: '2px', borderTopStyle: 'dashed' }}></div>
                            <span className="text-xs text-slate-400">Asynchronous</span>
                        </div>
                    </div>
                )}

                <Minimap
                    nodes={nodes}
                    connections={connections}
                    pan={pan}
                    scale={scale}
                    onPan={setPan}
                    onScale={setScale}
                />
            </div>

            {selectedNode && (
                <NodeConfigDrawer
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={onUpdateNode}
                />
            )}

            {selectedConnection && onUpdateConnection && onDeleteConnection && (
                <ConnectionDrawer
                    connection={selectedConnection}
                    onClose={() => setSelectedConnection(null)}
                    onUpdate={onUpdateConnection}
                    onDelete={() => {
                        onDeleteConnection(selectedConnection.id);
                        setSelectedConnection(null);
                    }}
                />
            )}
        </>
    );
}
