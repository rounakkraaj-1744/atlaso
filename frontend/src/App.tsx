import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ComponentRegistryPanel } from './components/sidebar/ComponentPalette';
import { Canvas } from './components/canvas/ArchitectureCanvas';
import { RightPanel } from './components/analysis/RightPanel';
import type { ComponentPack } from './types/registry';
import type { AnalysisResult, Suggestion } from './types';
import { analyzeSystem } from './utils/analyzer';
import { demoNodes, demoConnections } from './features/architecture/data/demo';
import { Play, Save, FolderOpen, RotateCcw, Keyboard } from 'lucide-react';
import { useArchitectureStore } from './features/architecture/store';
import { useConstraintsStore } from './features/constraints/store';

export default function App() {
  // Zustand stores
  const nodes = useArchitectureStore((state) => state.nodes);
  const connections = useArchitectureStore((state) => state.connections);
  const addNode = useArchitectureStore((state) => state.addNode);
  const updateNode = useArchitectureStore((state) => state.updateNode);
  const deleteNode = useArchitectureStore((state) => state.deleteNode);
  const duplicateNode = useArchitectureStore((state) => state.duplicateNode);
  const setNodePosition = useArchitectureStore((state) => state.setNodePosition);
  const addConnection = useArchitectureStore((state) => state.addConnection);
  const updateConnection = useArchitectureStore((state) => state.updateConnection);
  const deleteConnection = useArchitectureStore((state) => state.deleteConnection);
  const resetCanvas = useArchitectureStore((state) => state.resetCanvas);

  const constraints = useConstraintsStore((state) => state.constraints);
  const updateConstraints = useConstraintsStore((state) => state.updateConstraints);

  // Local UI state
  const [enabledPacks, setEnabledPacks] = useState<Set<ComponentPack>>(
    new Set(['aws', 'gcp', 'azure', 'oss'])
  );
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleRunAnalysis = () => {
    const result = analyzeSystem(nodes, connections, constraints);
    setAnalysis(result.analysis);
    setSuggestions(result.suggestions);

    // Update node statuses based on analysis
    result.analysis.bottlenecks.forEach((bottleneck) => {
      const node = nodes.find((n) => n.id === bottleneck.nodeId);
      if (node) {
        updateNode(node.id, {
          status: bottleneck.severity === 'high' ? 'overloaded' : 'bottleneck',
        });
      }
    });

    // Reset healthy nodes
    nodes.forEach((node) => {
      const isBottleneck = result.analysis.bottlenecks.some((b) => b.nodeId === node.id);
      if (!isBottleneck && node.status !== 'healthy') {
        updateNode(node.id, { status: 'healthy' });
      }
    });
  };

  const handleReset = () => {
    resetCanvas();
    setAnalysis(null);
    setSuggestions([]);
  };

  const handleLoadDemo = () => {
    // Clear existing
    resetCanvas();
    // Add demo nodes and connections
    demoNodes.forEach((node) => addNode(node));
    demoConnections.forEach((conn) => addConnection(conn));
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
            onAddNode={addNode}
            onUpdateNode={(node) => updateNode(node.id, node)}
            onNodePositionChange={setNodePosition}
            onDeleteNode={deleteNode}
            onDuplicateNode={duplicateNode}
            onUpdateConnection={(conn) => updateConnection(conn.id, conn)}
            onDeleteConnection={deleteConnection}
            onAddConnection={addConnection}
          />
          <RightPanel
            constraints={constraints}
            onConstraintsChange={updateConstraints}
            analysis={analysis}
            suggestions={suggestions}
            nodes={nodes}
          />
        </div>
      </div>
    </DndProvider>
  );
}