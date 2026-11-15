import { useRef, useState, useCallback, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ComponentNode } from './ComponentNode';
import type { CanvasNode, ComponentType, Connection } from '../../types';
import { componentRegistry } from '../../features/registry/data/components';
import { ZoomIn, ZoomOut, Maximize2, MousePointer2, Hand, MessageSquare, Square, Minus } from '../../lib/icons';

type CanvasTool = 'select' | 'hand' | 'comment' | 'rectangle' | 'line';

interface CanvasAnnotation {
    id: string;
    type: 'comment' | 'rectangle' | 'line';
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
}

interface DrawingState {
    tool: 'rectangle' | 'line';
    start: { x: number; y: number };
    current: { x: number; y: number };
}

interface AnnotationDragState {
    id: string;
    offsetX: number;
    offsetY: number;
}

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
    selectedNode: CanvasNode | null;
    setSelectedNode: (node: CanvasNode | null) => void;
    selectedConnection: Connection | null;
    setSelectedConnection: (conn: Connection | null) => void;
    onOpenReplaceTechnology?: (node: CanvasNode) => void;
    initialViewport?: { x: number; y: number; zoom: number };
    onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
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
    selectedNode,
    setSelectedNode,
    selectedConnection,
    setSelectedConnection,
    onOpenReplaceTechnology,
    initialViewport,
    onViewportChange,
}: CanvasProps) {
    void onUpdateNode;
    void onUpdateConnection;
    const canvasRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: initialViewport?.x ?? 0, y: initialViewport?.y ?? 0 });
    const [scale, setScale] = useState(initialViewport?.zoom ?? 1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<CanvasTool>('select');
    const [annotations, setAnnotations] = useState<CanvasAnnotation[]>([]);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [drawing, setDrawing] = useState<DrawingState | null>(null);
    const [annotationDrag, setAnnotationDrag] = useState<AnnotationDragState | null>(null);
    const [connectionSource, setConnectionSource] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        onViewportChange?.({ x: pan.x, y: pan.y, zoom: scale });
    }, [pan, scale, onViewportChange]);

    useEffect(() => {
        if (!isConnecting) 
            return;

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const shortcutTools: Record<string, CanvasTool> = {
                v: 'select',
                h: 'hand',
                c: 'comment',
                r: 'rectangle',
                l: 'line',
            };
            const shortcutTool = shortcutTools[e.key.toLowerCase()];
            if (shortcutTool && !e.metaKey && !e.ctrlKey && !e.altKey) {
                setActiveTool(shortcutTool);
                return;
            }

            if (e.key === 'Escape' && drawing) {
                setDrawing(null);
                return;
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
                setAnnotations((current) => current.filter((annotation) => annotation.id !== selectedAnnotationId));
                setSelectedAnnotationId(null);
                return;
            }

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
    }, [drawing, selectedAnnotationId, selectedNode, selectedConnection, onDeleteNode, onDeleteConnection, onDuplicateNode]);

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
            if (!offset || !canvasRef.current) 
                return;

            const rect = canvasRef.current.getBoundingClientRect();
            const x = (offset.x - rect.left - pan.x) / scale;
            const y = (offset.y - rect.top - pan.y) / scale;

            const definition = componentRegistry[item.componentType];
            if (!definition) 
                return;

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

    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
    const lastDistRef = useRef<number | null>(null);

    const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect)
            return null;

        return {
            x: (clientX - rect.left - pan.x) / scale,
            y: (clientY - rect.top - pan.y) / scale,
        };
    }, [pan, scale]);

    const addComment = useCallback((point: { x: number; y: number }) => {
        const text = window.prompt('Add comment');
        if (!text?.trim())
            return;

        const annotation: CanvasAnnotation = {
            id: `annotation-${Date.now()}`,
            type: 'comment',
            x: point.x,
            y: point.y,
            width: 150,
            height: 48,
            text: text.trim(),
        };
        setAnnotations((current) => [...current, annotation]);
        setSelectedAnnotationId(annotation.id);
        setActiveTool('select');
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button'))
            return;

        const point = getCanvasPoint(e.clientX, e.clientY);
        if (!point)
            return;

        if (activeTool === 'comment') {
            e.preventDefault();
            addComment(point);
            return;
        }

        if (activeTool === 'rectangle' || activeTool === 'line') {
            e.preventDefault();
            setSelectedAnnotationId(null);
            setDrawing({ tool: activeTool, start: point, current: point });
            return;
        }

        const shouldPan = activeTool === 'hand' || e.button === 1 || (e.button === 0 && e.shiftKey);
        if (shouldPan) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [activeTool, addComment, getCanvasPoint, pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (annotationDrag) {
            const point = getCanvasPoint(e.clientX, e.clientY);
            if (point) {
                setAnnotations((current) => current.map((annotation) => annotation.id === annotationDrag.id
                    ? { ...annotation, x: point.x - annotationDrag.offsetX, y: point.y - annotationDrag.offsetY }
                    : annotation));
            }
            return;
        }

        if (drawing) {
            const point = getCanvasPoint(e.clientX, e.clientY);
            if (point)
                setDrawing((current) => current ? { ...current, current: point } : null);
            return;
        }

        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    }, [annotationDrag, drawing, getCanvasPoint, isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        if (annotationDrag) {
            setAnnotationDrag(null);
            return;
        }

        if (drawing) {
            const { start, current, tool } = drawing;
            const width = current.x - start.x;
            const height = current.y - start.y;
            if (tool === 'line' || Math.abs(width) > 4 || Math.abs(height) > 4) {
                const annotation: CanvasAnnotation = {
                    id: `annotation-${Date.now()}`,
                    type: tool,
                    x: tool === 'line' ? start.x : Math.min(start.x, current.x),
                    y: tool === 'line' ? start.y : Math.min(start.y, current.y),
                    width,
                    height,
                };
                setAnnotations((currentAnnotations) => [...currentAnnotations, annotation]);
                setSelectedAnnotationId(annotation.id);
            }
            setDrawing(null);
            setActiveTool('select');
            return;
        }

        setIsPanning(false);
    }, [annotationDrag, drawing]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
            const point = getCanvasPoint(touch.clientX, touch.clientY);
            if (point && activeTool === 'comment') {
                addComment(point);
            } else if (point && (activeTool === 'rectangle' || activeTool === 'line')) {
                setDrawing({ tool: activeTool, start: point, current: point });
            } else if (activeTool === 'hand') {
                setIsPanning(true);
            }
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastDistRef.current = dist;
        }
    }, [activeTool, addComment, getCanvasPoint]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 1 && drawing) {
            const touch = e.touches[0];
            const point = getCanvasPoint(touch.clientX, touch.clientY);
            if (point)
                setDrawing((current) => current ? { ...current, current: point } : null);
        } else if (e.touches.length === 1 && isPanning && lastTouchRef.current) {
            const touch = e.touches[0];
            const dx = touch.clientX - lastTouchRef.current.x;
            const dy = touch.clientY - lastTouchRef.current.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        } else if (e.touches.length === 2 && lastDistRef.current) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = dist / lastDistRef.current;
            setScale(s => Math.min(Math.max(s * delta, 0.25), 2));
            lastDistRef.current = dist;
        }
    }, [drawing, getCanvasPoint, isPanning]);

    const handleTouchEnd = useCallback(() => {
        if (drawing)
            handleMouseUp();
        setIsPanning(false);
        lastTouchRef.current = null;
        lastDistRef.current = null;
    }, [drawing, handleMouseUp]);

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
        if (!connectionSource) 
            return null;
        const sourceNode = nodes.find(n => n.id === connectionSource);
        if (!sourceNode) 
            return null;
        return {
            x: sourceNode.position.x + 128,
            y: sourceNode.position.y + 40,
        };
    };

    const renderConnections = () => {
        return connections.map((conn) => {
            const source = nodes.find((n) => n.id === conn.sourceId);
            const target = nodes.find((n) => n.id === conn.targetId);
            if (!source || !target) 
                return null;

            const x1 = source.position.x + 128;
            const y1 = source.position.y + 40;
            const x2 = target.position.x;
            const y2 = target.position.y + 40;

            const isSelected = selectedConnection?.id === conn.id;
            const strokeColor = conn.type === 'async' ? '#60a5fa' : '#a78bfa';

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
                        stroke={isSelected ? '#38bdf8' : strokeColor}
                        strokeWidth={isSelected ? 3 : 2}
                        fill="none"
                        strokeDasharray="10,10"
                        className={conn.type === 'async' ? 'animate-flow-slow' : 'animate-flow'}
                        opacity={isSelected ? 1 : 0.7}
                    />
                    <circle cx={x2} cy={y2} r={isSelected ? 6 : 4} fill={isSelected ? '#38bdf8' : strokeColor} />
                    {conn.hasRetry && (
                        <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                    )}
                </g>
            );
        });
    };

    const renderConnectionPreview = () => {
        const sourcePos = getSourcePosition();
        if (!isConnecting || !sourcePos) 
            return null;

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

    const renderAnnotations = () => {
        const items = annotations.map((annotation) => {
            const isSelected = selectedAnnotationId === annotation.id;
            const commonProps = {
                onMouseDown: (event: React.MouseEvent) => {
                    if (activeTool !== 'select')
                        return;

                    const point = getCanvasPoint(event.clientX, event.clientY);
                    if (!point)
                        return;

                    event.stopPropagation();
                    setSelectedAnnotationId(annotation.id);
                    setAnnotationDrag({
                        id: annotation.id,
                        offsetX: point.x - annotation.x,
                        offsetY: point.y - annotation.y,
                    });
                },
                onClick: (event: React.MouseEvent) => {
                    event.stopPropagation();
                    if (activeTool === 'select')
                        setSelectedAnnotationId(annotation.id);
                },
                style: { cursor: activeTool === 'select' ? 'pointer' : 'crosshair' },
            };

            if (annotation.type === 'line') {
                return (
                    <g key={annotation.id} {...commonProps}>
                        <line x1={annotation.x} y1={annotation.y} x2={annotation.x + annotation.width} y2={annotation.y + annotation.height} stroke="transparent" strokeWidth="12" />
                        <line x1={annotation.x} y1={annotation.y} x2={annotation.x + annotation.width} y2={annotation.y + annotation.height} stroke={isSelected ? '#60a5fa' : '#cbd5e1'} strokeWidth={isSelected ? 3 : 2} />
                    </g>
                );
            }

            if (annotation.type === 'comment') {
                return (
                    <g key={annotation.id} {...commonProps}>
                        <rect x={annotation.x} y={annotation.y} width={annotation.width} height={annotation.height} rx="6" fill="#172033" stroke={isSelected ? '#60a5fa' : '#64748b'} strokeWidth={isSelected ? 2 : 1} />
                        <text x={annotation.x + 8} y={annotation.y + 20} fill="#e2e8f0" fontSize="12">{annotation.text}</text>
                    </g>
                );
            }

            return (
                <rect
                    key={annotation.id}
                    {...commonProps}
                    x={annotation.x}
                    y={annotation.y}
                    width={annotation.width}
                    height={annotation.height}
                    fill={isSelected ? 'rgba(96,165,250,0.12)' : 'rgba(148,163,184,0.08)'}
                    stroke={isSelected ? '#60a5fa' : '#94a3b8'}
                    strokeWidth={isSelected ? 3 : 2}
                />
            );
        });

        if (!drawing)
            return items;

        const width = drawing.current.x - drawing.start.x;
        const height = drawing.current.y - drawing.start.y;
        if (drawing.tool === 'line') {
            return [...items, <line key="drawing-preview" x1={drawing.start.x} y1={drawing.start.y} x2={drawing.current.x} y2={drawing.current.y} stroke="#60a5fa" strokeWidth="2" strokeDasharray="6 4" />];
        }

        return [
            ...items,
            <rect key="drawing-preview" x={Math.min(drawing.start.x, drawing.current.x)} y={Math.min(drawing.start.y, drawing.current.y)} width={Math.abs(width)} height={Math.abs(height)} fill="rgba(96,165,250,0.12)" stroke="#60a5fa" strokeWidth="2" strokeDasharray="6 4" />,
        ];
    };

    return (
        <>
            <div ref={(node) => {
                drop(node);
                if (node) 
                    canvasRef.current = node;
            }}
                className={`relative flex-1 h-full bg-slate-950 overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
                    } ${isOver ? 'bg-slate-900/50' : ''} ${isConnecting ? 'cursor-crosshair' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleCanvasClick}
            >
                <div className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
                        backgroundSize: `${32 * scale}px ${32 * scale}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`,
                    }} />

                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                    }}
                    className="relative w-full h-full"
                >
                    <svg className="absolute inset-0 w-1250 h-1250" style={{ pointerEvents: 'all' }}>
                        {renderAnnotations()}
                        {renderConnections()}
                        {renderConnectionPreview()}
                    </svg>

                    {nodes.map((node) => (
                        <ComponentNode key={node.id} node={node} onClick={() => setSelectedNode(node)} onPositionChange={onNodePositionChange} onDelete={onDeleteNode} scale={scale} interactionMode={activeTool} onStartConnection={handleStartConnection} onEndConnection={handleEndConnection} isConnecting={isConnecting} connectionSource={connectionSource} onOpenReplaceTechnology={onOpenReplaceTechnology}/>
                    ))}
                </div>

                {isConnecting && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 rounded-lg text-white text-sm font-medium shadow-lg z-50">
                        🔗 Click on another component to connect • ESC to cancel
                    </div>
                )}

                <div className="absolute top-6 right-6 flex flex-col gap-2 z-40">
                    <button onClick={handleZoomIn} className="p-2 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-colors shadow-lg" title="Zoom In">
                        <ZoomIn className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={handleZoomOut} className="p-2 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-colors shadow-lg" title="Zoom Out">
                        <ZoomOut className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={handleResetView} className="p-2 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-colors shadow-lg" title="Reset View" >
                        <Maximize2 className="w-4 h-4 text-slate-300" />
                    </button>
                </div>

                <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-2 p-1.5 bg-[#09090b]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-lg z-40">
                    <button onClick={() => setActiveTool('select')} className={`p-2 rounded-lg transition-colors ${activeTool === 'select' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Select (V)">
                        <MousePointer2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveTool('hand')} className={`p-2 rounded-lg transition-colors ${activeTool === 'hand' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Hand Tool (H)">
                        <Hand className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveTool('comment')} className={`p-2 rounded-lg transition-colors ${activeTool === 'comment' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Comment (C)">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveTool('rectangle')} className={`p-2 rounded-lg transition-colors ${activeTool === 'rectangle' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Rectangle (R)">
                        <Square className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveTool('line')} className={`p-2 rounded-lg transition-colors ${activeTool === 'line' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Line (L)">
                        <Minus className="w-4 h-4" />
                    </button>
                </div>

                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center space-y-2">
                            <div className="text-slate-600 text-base font-medium">Drag components from the left palette</div>
                            <div className="text-slate-700 text-xs">
                                Click right port to connect • Shift + Drag to pan • Scroll to zoom
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                    <span className="text-[10px] font-mono text-slate-300">{Math.round(scale * 100)}%</span>
                </div>

                {connections.length > 0 && (
                    <div className="absolute bottom-6 left-6 p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl space-y-2 shadow-lg">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Connections
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 bg-purple-400/80"></div>
                            <span className="text-[10px] text-slate-300 font-medium">Synchronous</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 border-t-2 border-dashed border-blue-400/80"></div>
                            <span className="text-[10px] text-slate-300 font-medium">Asynchronous</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
