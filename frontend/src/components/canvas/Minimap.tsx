import { CanvasNode, Connection } from '../../types';

interface MinimapProps {
  nodes: CanvasNode[];
  connections: Connection[];
  pan: { x: number; y: number };
  scale: number;
  onPan: (pan: { x: number; y: number }) => void;
  onScale: (scale: number) => void;
}

export function Minimap({ nodes, connections, pan, scale }: MinimapProps) {
  if (nodes.length === 0) return null;

  // Calculate bounds of all nodes
  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxX: Math.max(acc.maxX, node.position.x + 288), // node width
      maxY: Math.max(acc.maxY, node.position.y + 200), // approx node height
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  // Add padding
  const padding = 50;
  bounds.minX -= padding;
  bounds.minY -= padding;
  bounds.maxX += padding;
  bounds.maxY += padding;

  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  // Minimap dimensions
  const minimapWidth = 200;
  const minimapHeight = 150;
  const scaleX = minimapWidth / contentWidth;
  const scaleY = minimapHeight / contentHeight;
  const minimapScale = Math.min(scaleX, scaleY);

  // Viewport rectangle in minimap coordinates
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportRect = {
    x: (-pan.x / scale - bounds.minX) * minimapScale,
    y: (-pan.y / scale - bounds.minY) * minimapScale,
    width: (viewportWidth / scale) * minimapScale,
    height: (viewportHeight / scale) * minimapScale,
  };

  return (
    <div className="absolute bottom-24 left-4 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg p-2 shadow-xl">
      <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2 px-1">Minimap</div>
      <svg
        width={minimapWidth}
        height={minimapHeight}
        className="bg-slate-900/50 rounded"
      >
        {/* Connections */}
        {connections.map((conn) => {
          const source = nodes.find((n) => n.id === conn.sourceId);
          const target = nodes.find((n) => n.id === conn.targetId);
          if (!source || !target) return null;

          const x1 = (source.position.x + 144 - bounds.minX) * minimapScale;
          const y1 = (source.position.y + 75 - bounds.minY) * minimapScale;
          const x2 = (target.position.x + 144 - bounds.minX) * minimapScale;
          const y2 = (target.position.y + 75 - bounds.minY) * minimapScale;

          return (
            <line
              key={conn.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={conn.type === 'async' ? '#3b82f6' : '#8b5cf6'}
              strokeWidth={1}
              opacity={0.4}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const x = (node.position.x - bounds.minX) * minimapScale;
          const y = (node.position.y - bounds.minY) * minimapScale;
          const width = 288 * minimapScale;
          const height = 150 * minimapScale;

          const color =
            node.status === 'overloaded'
              ? '#ef4444'
              : node.status === 'bottleneck'
                ? '#f97316'
                : node.status === 'warning'
                  ? '#eab308'
                  : '#10b981';

          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={color}
              opacity={0.6}
              rx={2}
            />
          );
        })}

        {/* Viewport rectangle */}
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.width}
          height={viewportRect.height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          opacity={0.8}
        />
      </svg>
    </div>
  );
}