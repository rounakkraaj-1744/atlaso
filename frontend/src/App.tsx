import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ComponentRegistryPanel } from './components/sidebar/ComponentPalette';
import { Canvas } from './components/canvas/ArchitectureCanvas';
import { RightPanel } from './components/analysis/RightPanel';
import { CanvasNode, SystemConstraints, AnalysisResult, Suggestion, Connection } from './types';
import { ComponentPack } from './types/registry';
import { analyzeSystem } from './utils/analyzer';
import { demoNodes, demoConnections } from './data/demoArchitecture';
import { Play, Save, FolderOpen, RotateCcw, Keyboard } from 'lucide-react';

export default function App() {
  const [nodes, setNodes] = useState<CanvasNode[]>(demoNodes);
  const [connections, setConnections] = useState<Connection[]>(demoConnections);
  const [enabledPacks, setEnabledPacks] = useState<Set<ComponentPack>>(
    new Set(['aws', 'gcp', 'azure', 'oss'])
  );
  const [constraints, setConstraints] = useState<SystemConstraints>({
    avgRPS: 1000,
    peakRPS: 5000,
    readWriteRatio: 80,
    payloadSize: 10,
    slaLatency: 100,
    retryAttempts: 3,
    rateLimitRPS: 10000,
    consumerLagTolerance: 30,
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleAddNode = (node: CanvasNode) => {
    setNodes((prev) => [...prev, node]);
  };

  const handleUpdateNode = (updatedNode: CanvasNode) => {
    setNodes((prev) => prev.map((node) => (node.id === updatedNode.id ? updatedNode : node)));
  };

  const handleNodePositionChange = (id: string, position: { x: number; y: number }) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, position } : node))
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.sourceId !== nodeId && c.targetId !== nodeId));
  };

  const handleDuplicateNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const newNode: CanvasNode = {
      ...node,
      id: `node-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const handleRunAnalysis = () => {
    const result = analyzeSystem(nodes, connections, constraints);
    setAnalysis(result.analysis);
    setSuggestions(result.suggestions);

    // Update node statuses based on analysis
    setNodes((prev) =>
      prev.map((node) => {
        const bottleneck = result.analysis.bottlenecks.find((b) => b.nodeId === node.id);
        if (bottleneck) {
          return {
            ...node,
            status: bottleneck.severity === 'high' ? 'overloaded' : 'bottleneck',
          };
        }
        return { ...node, status: 'healthy' };
      })
    );
  };

  const handleReset = () => {
    setNodes([]);
    setConnections([]);
    setAnalysis(null);
    setSuggestions([]);
  };

  const handleLoadDemo = () => {
    setNodes(demoNodes);
    setConnections(demoConnections);
  };

  const handleTogglePack = (pack: ComponentPack) => {
    const newPacks = new Set(enabledPacks);
    if (newPacks.has(pack)) {
      newPacks.delete(pack);
    } else {
      newPacks.add(pack);
    }
    setEnabledPacks(newPacks);
  };

  const handleUpdateConnection = (connection: Connection) => {
    setConnections((prev) => prev.map((c) => (c.id === connection.id ? connection : c)));
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const handleAddConnection = (connection: Connection) => {
    setConnections((prev) => [...prev, connection]);
  };

  // Auto-run analysis when constraints or nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      handleRunAnalysis();
    }
  }, [nodes.length, constraints]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-slate-950">
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-700/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-100">Atlaso</h1>
              <p className="text-xs text-slate-500">Distributed System Design & Constraint Analyzer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={nodes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Run Analysis
            </button>

            <div className="w-px h-8 bg-slate-700"></div>

            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm text-slate-300"
              title="Load Demo Architecture"
            >
              <FolderOpen className="w-4 h-4" />
              Demo
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm text-slate-300"
              title="Reset Canvas"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            <div className="w-px h-8 bg-slate-700"></div>

            <button
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Save Architecture"
            >
              <Save className="w-5 h-5 text-slate-400" />
            </button>

            <button
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          <ComponentRegistryPanel
            enabledPacks={enabledPacks}
            onTogglePack={handleTogglePack}
          />
          <Canvas
            nodes={nodes}
            connections={connections}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onNodePositionChange={handleNodePositionChange}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onUpdateConnection={handleUpdateConnection}
            onDeleteConnection={handleDeleteConnection}
            onAddConnection={handleAddConnection}
          />
          <RightPanel
            constraints={constraints}
            onConstraintsChange={setConstraints}
            analysis={analysis}
            suggestions={suggestions}
            nodes={nodes}
          />
        </div>
      </div>
    </DndProvider>
  );
}