import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { TopNavigation } from './components/layout/TopNavigation';
import { ComponentRegistryPanel } from './components/sidebar/ComponentPalette';
import { Canvas } from './components/canvas/ArchitectureCanvas';
import { RightPanel } from './components/analysis/RightPanel';
import { BottomPanel } from './components/analysis/BottomPanel';
import { LoadArchitectureModal, SaveArchitectureModal } from './components/modals';
import { ReplaceTechnologyModal } from './components/modals/ProviderMappingModal';
import type { AnalysisResult, Suggestion, CanvasNode, Connection } from './types';
import { analyzeSystem } from './features/analysis/engine/analyzer';
import { X } from 'lucide-react';
import { useArchitectureStore } from './features/architecture/store';
import { useConstraintsStore } from './features/constraints/store';
import { useCreateArchitecture } from './features/architecture/hooks/useArchitectures';
import type { Architecture } from './lib/api';
import { TouchBackend } from 'react-dnd-touch-backend';

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showReplaceTechnologyModal, setShowReplaceTechnologyModal] = useState(false);
  const [replaceTechnologyNode, setReplaceTechnologyNode] = useState<CanvasNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
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

    (architecture.nodes || []).forEach((node: CanvasNode) => {
      addNode(node);
    });

    (architecture.edges || []).forEach((edge: Connection) => {
      addConnection({
        ...edge,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      });
    });

    setShowLoadModal(false);
  };

  useEffect(() => {
    if (nodes.length > 0)
      handleRunAnalysis();
  }, [nodes.length, constraints]);
  return (
    <DndProvider backend={backend} options={backendOptions}>
      <div className="h-screen flex flex-col bg-transparent">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
        </div>

        <TopNavigation nodes={nodes} onRunAnalysis={handleRunAnalysis} isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen} isRightPanelOpen={isRightPanelOpen} setIsRightPanelOpen={setIsRightPanelOpen} projectName="WhatsApp Clone v2" />

        <div className="flex-1 flex overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            {(isLeftPanelOpen || window.innerWidth >= 768) && (
              <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                  fixed inset-y-0 left-0 z-30 w-72 bg-[#09090b]/95 border-r border-white/5 pt-14 md:pt-0
                  md:relative md:translate-x-0 md:inset-auto md:w-72
                  ${isLeftPanelOpen ? 'block' : 'hidden md:block'}
                `}>
                <div className="h-full flex flex-col relative">
                  <button className="md:hidden absolute top-2 right-2 p-2 text-slate-400 hover:text-white z-10" onClick={() => setIsLeftPanelOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                  <ComponentRegistryPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLeftPanelOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setIsLeftPanelOpen(false)}/>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex relative min-h-0">
              <div className="flex-1 relative z-0">
                <Canvas nodes={nodes} connections={connections} onAddNode={addNode} onUpdateNode={(node) => updateNode(node.id, node)} onNodePositionChange={setNodePosition} onDeleteNode={deleteNode} onDuplicateNode={duplicateNode} onUpdateConnection={(conn) => updateConnection(conn.id, conn)} onDeleteConnection={deleteConnection} onAddConnection={addConnection} selectedNode={selectedNode} setSelectedNode={setSelectedNode} selectedConnection={selectedConnection} setSelectedConnection={setSelectedConnection}
                  onOpenReplaceTechnology={(node) => {
                    setReplaceTechnologyNode(node);
                    setShowReplaceTechnologyModal(true);
                  }}/>
              </div>

              <AnimatePresence mode="wait">
                {(isRightPanelOpen || window.innerWidth >= 768) && (
                  <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`
                      fixed inset-y-0 right-0 z-30 w-85 bg-[#09090b]/95 border-l border-white/5 pt-14 md:pt-0
                      md:relative md:translate-x-0 md:inset-auto md:w-85
                      ${isRightPanelOpen ? 'block' : 'hidden md:block'}
                    `} >
                    <div className="h-full flex flex-col relative">
                      <button className="md:hidden absolute top-2 left-2 p-2 text-slate-400 hover:text-white z-10" onClick={() => setIsRightPanelOpen(false)}>
                        <X className="w-5 h-5" />
                      </button>
                      <RightPanel constraints={constraints} onConstraintsChange={updateConstraints} analysis={analysis} suggestions={suggestions} nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode} onUpdateNode={(node) => updateNode(node.id, node)}
                      selectedConnection={selectedConnection}
                      setSelectedConnection={setSelectedConnection}
                      onUpdateConnection={(conn) => updateConnection(conn.id, conn)}
                      onDeleteConnection={deleteConnection}
                      onOpenReplaceTechnology={(node) => {
                        setReplaceTechnologyNode(node);
                        setShowReplaceTechnologyModal(true);
                      }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

            <BottomPanel analysis={analysis} suggestions={suggestions} isOpen={true} setIsOpen={() => {}} isExpanded={false} setIsExpanded={() => {}} />
          </div>
        </div>
      </div>

      <SaveArchitectureModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSave} isLoading={createArchitecture.isPending}/>

      <LoadArchitectureModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} onLoad={handleLoad} />
      <ReplaceTechnologyModal
        isOpen={showReplaceTechnologyModal}
        onClose={() => {
          setShowReplaceTechnologyModal(false);
          setReplaceTechnologyNode(null);
        }}
        primitiveName={replaceTechnologyNode?.config.name || 'Authentication'}
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