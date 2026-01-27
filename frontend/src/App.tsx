import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { ComponentRegistryPanel } from './components/sidebar/ComponentPalette';
import { Canvas } from './components/canvas/ArchitectureCanvas';
import { RightPanel } from './components/analysis/RightPanel';
import { LoadArchitectureModal, SaveArchitectureModal } from './components/modals';
import type { ComponentPack } from './types/registry';
import type { AnalysisResult, Suggestion, CanvasNode, Connection } from './types';
import { analyzeSystem } from './features/analysis/engine/analyzer';
import { demoNodes, demoConnections } from './features/architecture/data/demo';
import { Play, Save, FolderOpen, RotateCcw, Upload, Menu, PanelRight, X } from 'lucide-react';
import { useArchitectureStore } from './features/architecture/store';
import { useConstraintsStore } from './features/constraints/store';
import { useCreateArchitecture } from './features/architecture/hooks/useArchitectures';
import type { Architecture } from './lib/api';

import { TouchBackend } from 'react-dnd-touch-backend';

// Detect touch device
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Select backend
const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
const backendOptions = isTouchDevice() ? { enableMouseEvents: true } : {};

function AppContent() {
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

  const createArchitecture = useCreateArchitecture();

  const [enabledPacks, setEnabledPacks] = useState<Set<ComponentPack>>(
    new Set(['aws', 'gcp', 'azure', 'oss'])
  );
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Responsive UI state
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const handleRunAnalysis = () => {
    const result = analyzeSystem(nodes, connections, constraints);
    setAnalysis(result.analysis);
    setSuggestions(result.suggestions);

    result.analysis.bottlenecks.forEach((bottleneck) => {
      const node = nodes.find((n) => n.id === bottleneck.nodeId);
      if (node) {
        updateNode(node.id, {
          status: bottleneck.severity === 'high' ? 'overloaded' : 'bottleneck',
        });
      }
    });

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
    resetCanvas();
    demoNodes.forEach((node) => addNode(node));
    demoConnections.forEach((conn) => addConnection(conn));
  };

  const handleTogglePack = (pack: ComponentPack) => {
    const newPacks = new Set(enabledPacks);
    if (newPacks.has(pack))
      newPacks.delete(pack);
    else
      newPacks.add(pack);
    setEnabledPacks(newPacks);
  };

  const handleSave = async (name: string, description: string) => {
    console.log('[Save] Saving architecture:', { name, nodesCount: nodes.length, edgesCount: connections.length });
    console.log('[Save] Nodes:', nodes);
    console.log('[Save] Edges:', connections);

    try {
      await createArchitecture.mutateAsync({
        name,
        description,
        nodes,
        edges: connections,
      });
      setShowSaveModal(false);
    } catch (error) {
      console.error('Failed to save architecture:', error);
      toast.error('Failed to save architecture. Please check backend connection.');
    }
  };

  const handleLoad = (architecture: Architecture) => {
    console.log('[Load] Loading architecture:', architecture);
    console.log('[Load] Nodes:', architecture.nodes);
    console.log('[Load] Edges:', architecture.edges);

    resetCanvas();

    // Load nodes
    (architecture.nodes || []).forEach((node: CanvasNode) => {
      addNode(node);
    });

    // Load edges (map back to connections format)
    (architecture.edges || []).forEach((edge: Connection) => {
      addConnection({
        ...edge,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      });
    });

    // setCurrentArchitectureId(architecture.id);
    setShowLoadModal(false);
  };

  useEffect(() => {
    if (nodes.length > 0)
      handleRunAnalysis();
  }, [nodes.length, constraints]);

  // const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
  // const backendOptions = isTouchDevice() ? { enableMouseEvents: true } : {};

  return (
    <DndProvider backend={backend} options={backendOptions}>
      <div className="h-screen flex flex-col bg-slate-950">
        <header className="h-16 bg-slate-900 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 shrink-0 z-40 relative">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Atlaso</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Distributed System Design & Constraint Analyzer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={nodes.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 rounded-lg text-white text-xs md:text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Play className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Run Analysis</span>
              <span className="sm:hidden">Run</span>
            </button>

            <div className="w-px h-6 md:h-8 bg-slate-700 mx-1"></div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowLoadModal(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm text-slate-300"
                title="Load Saved Architecture"
              >
                <Upload className="w-4 h-4" />
                Load
              </button>

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
                onClick={() => setShowSaveModal(true)}
                disabled={nodes.length === 0}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm text-slate-300 disabled:opacity-50"
                title="Save Architecture"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            {/* Mobile Actions Menu or simplified buttons */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setShowLoadModal(true)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={nodes.length === 0}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>

            <button
              className="md:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              <PanelRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Panel - Mobile Drawer & Desktop Sidebar */}
          <AnimatePresence mode="wait">
            {(isLeftPanelOpen || window.innerWidth >= 768) && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                  fixed inset-y-0 left-0 z-30 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 pt-16 md:pt-0
                  md:relative md:translate-x-0 md:inset-auto md:w-72
                  ${isLeftPanelOpen ? 'block' : 'hidden md:block'}
                `}
              >
                <div className="h-full flex flex-col relative">
                  <button
                    className="md:hidden absolute top-2 right-2 p-2 text-slate-400 hover:text-white"
                    onClick={() => setIsLeftPanelOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <ComponentRegistryPanel
                    enabledPacks={enabledPacks}
                    onTogglePack={handleTogglePack}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay for mobile left panel */}
          {isLeftPanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm"
              onClick={() => setIsLeftPanelOpen(false)}
            />
          )}

          {/* Main Canvas Area */}
          <div className="flex-1 relative z-0">
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
          </div>

          {/* Right Panel - Mobile Drawer & Desktop Sidebar */}
          <AnimatePresence mode="wait">
            {(isRightPanelOpen || window.innerWidth >= 768) && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                  fixed inset-y-0 right-0 z-30 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 pt-16 md:pt-0
                  md:relative md:translate-x-0 md:inset-auto md:w-80
                  ${isRightPanelOpen ? 'block' : 'hidden md:block'}
                `}
              >
                <div className="h-full flex flex-col relative">
                  <button
                    className="md:hidden absolute top-2 left-2 p-2 text-slate-400 hover:text-white z-10"
                    onClick={() => setIsRightPanelOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <RightPanel
                    constraints={constraints}
                    onConstraintsChange={updateConstraints}
                    analysis={analysis}
                    suggestions={suggestions}
                    nodes={nodes}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay for mobile right panel */}
          {isRightPanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm"
              onClick={() => setIsRightPanelOpen(false)}
            />
          )}
        </div>
      </div>

      <SaveArchitectureModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        isLoading={createArchitecture.isPending}
      />

      <LoadArchitectureModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={handleLoad}
      />
      <Toaster position="top-center" theme="dark" richColors />
    </DndProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}