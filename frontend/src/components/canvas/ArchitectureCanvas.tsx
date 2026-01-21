import { useRef, useState, useCallback, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ComponentNode } from './ComponentNode';
import { NodeConfigDrawer } from './NodeConfigDrawer';
import { ConnectionDrawer } from './ConnectionDrawer';
import { Minimap } from './Minimap';
import { CanvasNode, ComponentType, Connection } from '../../types';
import { componentRegistry } from '../../data/componentRegistry';
import { ZoomIn, ZoomOut, Maximize2, Keyboard } from 'lucide-react';

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
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete selected node
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNode && onDeleteNode) {
                    onDeleteNode(selectedNode.id);
                    setSelectedNode(null);
                }
            }

            // Duplicate selected node (Cmd/Ctrl + D)
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                if (selectedNode && onDuplicateNode) {
                    onDuplicateNode(selectedNode.id);
                }
            }

            // Show shortcuts (?)
            if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
                setShowShortcuts(!showShortcuts);
            }

            // Escape to deselect
            if (e.key === 'Escape') {
                setSelectedNode(null);
                setSelectedConnection(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, onDeleteNode, onDuplicateNode, showShortcuts]);

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

    const renderConnections = () => {
        return connections.map((conn) => {
            const source = nodes.find((n) => n.id === conn.sourceId);
            const target = nodes.find((n) => n.id === conn.targetId);
            if (!source || !target) return null;

            const x1 = source.position.x + 128; // Half of node width (256px)
            const y1 = source.position.y + 60;
            const x2 = target.position.x + 128;
            const y2 = target.position.y + 60;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const path = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

            return (
                <g key={conn.id}>
                    <path
                        d={path}
                        stroke={conn.type === 'async' ? '#3b82f6' : '#8b5cf6'}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={conn.type === 'async' ? '5,5' : '0'}
                        opacity="0.6"
                    />
                    <circle cx={x2} cy={y2} r="4" fill={conn.type === 'async' ? '#3b82f6' : '#8b5cf6'} />
                    {conn.hasRetry && (
                        <circle cx={midX} cy={midY} r="6" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
                    )}
                </g>
            );
        });
    };

    return (
        <>
            <div
                ref={(node) => {
                    drop(node);
                    if (node) canvasRef.current = node;
                }}
                className={`relative flex-1 h-full bg-slate-950 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'
                    } ${isOver ? 'bg-slate-900/50' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Grid background */}
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

                {/* Canvas content */}
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                    }}
                    className="relative w-full h-full"
                >
                    {/* Connections */}
                    <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none">
                        {renderConnections()}
                    </svg>

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <ComponentNode
                            key={node.id}
                            node={node}
                            onClick={() => setSelectedNode(node)}
                            onPositionChange={onNodePositionChange}
                            onDelete={onDeleteNode}
                            scale={scale}
                        />
                    ))}
                </div>

                {/* Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
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

                {/* Instructions */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center space-y-3">
                            <div className="text-slate-600 text-lg">Drag components from the left palette</div>
                            <div className="text-slate-700 text-sm">
                                Shift + Drag or Middle Mouse to pan • Scroll to zoom
                            </div>
                        </div>
                    </div>
                )}

                {/* Zoom indicator */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                    <span className="text-xs font-mono text-slate-400">{Math.round(scale * 100)}%</span>
                </div>

                {/* Legend */}
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
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-yellow-800"></div>
                            <span className="text-xs text-slate-400">Retry enabled</span>
                        </div>
                    </div>
                )}

                {/* Minimap */}
                <Minimap
                    nodes={nodes}
                    connections={connections}
                    pan={pan}
                    scale={scale}
                    onPan={setPan}
                    onScale={setScale}
                />
            </div>

            {/* Node Config Drawer */}
            {selectedNode && (
                <NodeConfigDrawer
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={onUpdateNode}
                />
            )}

            {/* Connection Config Drawer */}
            {selectedConnection && onUpdateConnection && onDeleteConnection && (
                <ConnectionDrawer
                    connection={selectedConnection}
                    onClose={() => setSelectedConnection(null)}
                    onUpdate={onUpdateConnection}
                    onDelete={() => onDeleteConnection(selectedConnection.id)}
                />
            )}

            {/* Keyboard Shortcuts */}
            {showShortcuts && (
                <div className="absolute top-4 left-4 p-3 bg-slate-800 border border-slate-700 rounded-lg space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Keyboard Shortcuts
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-purple-500"></div>
                        <span className="text-xs text-slate-400">Delete Node (Delete/Backspace)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-blue-500 border-dashed" style={{ borderTopWidth: '2px', borderTopStyle: 'dashed' }}></div>
                        <span className="text-xs text-slate-400">Duplicate Node (Cmd/Ctrl + D)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-yellow-800"></div>
                        <span className="text-xs text-slate-400">Show Shortcuts (?)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-yellow-800"></div>
                        <span className="text-xs text-slate-400">Deselect (Escape)</span>
                    </div>
                </div>
            )}
        </>
    );
}