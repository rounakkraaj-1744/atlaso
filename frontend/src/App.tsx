import { useCallback, useEffect, useRef, useState } from 'react';
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
import { CreateProjectModal, LoadArchitectureModal, SaveArchitectureModal } from './components/modals';
import { ReplaceTechnologyModal } from './components/modals/ProviderMappingModal';
import type { AnalysisResult, Suggestion, CanvasNode, Connection } from './types';
import { analyzeSystem } from './features/analysis/engine/analyzer';
import { X } from 'lucide-react';
import { useArchitectureStore } from './features/architecture/store';
import { useConstraintsStore } from './features/constraints/store';
import { useCreateArchitecture, useCreateProject, useProjects, useSaveCanvas } from './features/architecture/hooks/useArchitectures';
import type { Architecture, CanvasDocument, Project } from './lib/api';
import { TouchBackend } from 'react-dnd-touch-backend';
import { AuthScreen } from './components/auth/AuthScreen';
import { api, type AuthUser } from './lib/api';

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
const backendOptions = isTouchDevice() ? { enableMouseEvents: true } : {};
const EMPTY_PROJECTS: Project[] = [];

function ArchitectureWorkspace({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
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
  const loadCanvas = useArchitectureStore((state) => state.loadCanvas);
  const setActiveArchitecture = useArchitectureStore((state) => state.setActiveArchitecture);
  const activeArchitectureVersion = useArchitectureStore((state) => state.activeArchitectureVersion);
  const viewport = useArchitectureStore((state) => state.viewport);
  const canvasDocumentProperties = useArchitectureStore((state) => state.canvasDocumentProperties);
  const setCanvasDocumentProperties = useArchitectureStore((state) => state.setCanvasDocumentProperties);
  const constraints = useConstraintsStore((state) => state.constraints);
  const updateConstraints = useConstraintsStore((state) => state.updateConstraints);
  const createArchitecture = useCreateArchitecture();
  const saveCanvas = useSaveCanvas();
  const activeArchitectureId = useArchitectureStore((state) => state.activeArchitectureId);
  const { data: projectsResponse } = useProjects();
  const createProject = useCreateProject();
  const projects = projectsResponse?.data ?? EMPTY_PROJECTS;
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem('atlaso.activeProjectId') ?? '');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentArchitecture, setCurrentArchitecture] = useState<Architecture | null>(null);
  const hasRestoredCanvas = useRef(false);
  const handleViewportChange = useCallback((next: { x: number; y: number; zoom: number }) => {
    useArchitectureStore.getState().setViewport(next);
  }, []);
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

  useEffect(() => {
    if (!activeProjectId && projects.length > 0) setActiveProjectId(projects[0]!.id);
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem('atlaso.activeProjectId', activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    const savedArchitectureId = localStorage.getItem('atlaso.activeArchitectureId');
    if (!savedArchitectureId || projects.length === 0 || isRestoring || hasRestoredCanvas.current) return;
    hasRestoredCanvas.current = true;
    setIsRestoring(true);
    void (async () => {
      try {
        const architecture = (await api.getArchitecture(savedArchitectureId)).data;
        if (!architecture || !projects.some((project) => project.id === architecture.projectId)) {
          localStorage.removeItem('atlaso.activeArchitectureId');
          return;
        }
        const canvas = (await api.getCanvas(architecture.id)).data;
        if (!canvas) return;
        const document = canvas.document;
        setCurrentArchitecture(architecture);
        loadCanvas(document.nodes, document.connections, document.viewport);
        setCanvasDocumentProperties(document);
        const savedConstraints = document.metadata && typeof document.metadata === 'object' ? (document.metadata as Record<string, unknown>).constraints : undefined;
        if (savedConstraints && typeof savedConstraints === 'object') updateConstraints(savedConstraints as typeof constraints);
        setActiveProjectId(architecture.projectId ?? '');
        localStorage.setItem('atlaso.activeArchitectureId', architecture.id);
        setActiveArchitecture(architecture.id, canvas.revision);
      } catch (error) {
        console.error('Could not restore the last architecture', error);
        toast.error('Could not restore the last architecture. Open it again from your project.');
      } finally {
        setIsRestoring(false);
      }
    })();
  }, [projects, isRestoring, loadCanvas, setActiveArchitecture, updateConstraints, constraints, setCanvasDocumentProperties]);

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

  const handleSave = async (name: string, description: string, type: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT') => {
    if (!activeProjectId) {
      toast.error('Create or select a project before saving an architecture.');
      setShowSaveModal(false);
      setShowCreateProjectModal(true);
      return;
    }
    try {
      const previousMetadata = canvasDocumentProperties.metadata && typeof canvasDocumentProperties.metadata === 'object' ? canvasDocumentProperties.metadata as Record<string, unknown> : {};
      const document: CanvasDocument = { ...canvasDocumentProperties, nodes, connections, viewport, metadata: { ...previousMetadata, constraints } };
      if (activeArchitectureId) {
        const response = await saveCanvas.mutateAsync({ id: activeArchitectureId, document, expectedRevision: activeArchitectureVersion ?? 1, metadata: { name, description, type } });
        if (!response.data) throw new Error('The server did not return the saved canvas.');
        setActiveArchitecture(response.data.architectureId, response.data.revision);
        setCurrentArchitecture((current) => current ? { ...current, name, description, type } : current);
        setCanvasDocumentProperties(response.data.document);
        toast.success('Architecture saved');
      } else {
        const response = await createArchitecture.mutateAsync({ name, description, type, projectId: activeProjectId, nodes, edges: connections, canvasMetadata: { viewport, constraints } });
        if (!response.data?.id) throw new Error('The server did not return the new architecture.');
        setActiveArchitecture(response.data.id, response.data.version);
        setCurrentArchitecture(response.data);
        setCanvasDocumentProperties(document);
        localStorage.setItem('atlaso.activeArchitectureId', response.data.id);
        toast.success('Architecture created and saved');
      }
      setShowSaveModal(false);
    } catch (error) {
      console.error('Failed to save architecture:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save architecture.');
    }
  };

  const handleLoad = async (architecture: Architecture) => {
    try {
      const canvas = (await api.getCanvas(architecture.id)).data;
      if (!canvas) throw new Error('Canvas document was not returned.');
      loadCanvas(canvas.document.nodes, canvas.document.connections, canvas.document.viewport);
      setCurrentArchitecture(architecture);
      setCanvasDocumentProperties(canvas.document);
      const savedConstraints = canvas.document.metadata && typeof canvas.document.metadata === 'object' ? (canvas.document.metadata as Record<string, unknown>).constraints : undefined;
      if (savedConstraints && typeof savedConstraints === 'object') updateConstraints(savedConstraints as typeof constraints);
      setActiveProjectId(architecture.projectId ?? activeProjectId);
      setActiveArchitecture(architecture.id, canvas.revision);
      localStorage.setItem('atlaso.activeArchitectureId', architecture.id);
      setShowLoadModal(false);
      toast.success(`Opened ${architecture.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open architecture.');
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const response = await createProject.mutateAsync({ name, description });
      if (!response.data) throw new Error('The server did not return the new project.');
      setActiveProjectId(response.data.id);
      setShowCreateProjectModal(false);
      setActiveArchitecture(null, null);
      setCurrentArchitecture(null);
      localStorage.removeItem('atlaso.activeArchitectureId');
      loadCanvas([], [], { x: 0, y: 0, zoom: 1 });
      toast.success(`Created project ${response.data.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create project.');
    }
  };

  const handleProjectChange = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveArchitecture(null, null);
    setCurrentArchitecture(null);
    loadCanvas([], [], { x: 0, y: 0, zoom: 1 });
    localStorage.removeItem('atlaso.activeArchitectureId');
  };

  const runAnalysisRef = useRef(handleRunAnalysis);
  runAnalysisRef.current = handleRunAnalysis;
  useEffect(() => {
    if (nodes.length > 0)
      runAnalysisRef.current();
  }, [nodes.length, constraints]);
  return (
    <DndProvider backend={backend} options={backendOptions}>
      <div className="h-screen flex flex-col bg-transparent">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
        </div>

        <TopNavigation nodes={nodes} onRunAnalysis={handleRunAnalysis} isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen} isRightPanelOpen={isRightPanelOpen} setIsRightPanelOpen={setIsRightPanelOpen} projectName={projects.find((project) => project.id === activeProjectId)?.name ?? 'No project selected'} architectureName={currentArchitecture?.name ?? 'Untitled architecture'} user={user} onSignOut={onSignOut} projects={projects} activeProjectId={activeProjectId} onProjectChange={handleProjectChange} onNewProject={() => setShowCreateProjectModal(true)} onSave={() => setShowSaveModal(true)} onLoad={() => setShowLoadModal(true)} />

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
                <Canvas nodes={nodes} connections={connections} onAddNode={addNode} onUpdateNode={(node) => updateNode(node.id, node)} onNodePositionChange={setNodePosition} onDeleteNode={deleteNode} onDuplicateNode={duplicateNode} onUpdateConnection={(conn) => updateConnection(conn.id, conn)} onDeleteConnection={deleteConnection} onAddConnection={addConnection} selectedNode={selectedNode} setSelectedNode={setSelectedNode} selectedConnection={selectedConnection} setSelectedConnection={setSelectedConnection} initialViewport={viewport} onViewportChange={handleViewportChange}
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

      {showSaveModal && <SaveArchitectureModal key={`${activeArchitectureId ?? 'new'}-${currentArchitecture?.name ?? ''}`} isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSave} isLoading={createArchitecture.isPending || saveCanvas.isPending || isRestoring} defaultName={currentArchitecture?.name ?? ''} defaultDescription={currentArchitecture?.description ?? ''} defaultType={currentArchitecture?.type} projectName={projects.find((project) => project.id === activeProjectId)?.name}/>}

      <LoadArchitectureModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} onLoad={handleLoad} projectId={activeProjectId || undefined}/>
      <CreateProjectModal isOpen={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} onCreate={handleCreateProject} isLoading={createProject.isPending}/>
      <ReplaceTechnologyModal
        isOpen={showReplaceTechnologyModal}
        onClose={() => {
          setShowReplaceTechnologyModal(false);
          setReplaceTechnologyNode(null);
        }}
        primitiveName={replaceTechnologyNode?.config.name || 'Authentication'}
        onApply={(provider, technology) => {
          if (replaceTechnologyNode) {
            updateNode(replaceTechnologyNode.id, { providerMapping: { provider, technology, mappingStatus: 'manual' } });
          }
        }}
      />
      <Toaster position="top-center" theme="dark" richColors />
    </DndProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const refreshSession = async () => {
    setSessionError('');
    try {
      const authSession = await api.currentUser();
      setUser(authSession?.user ?? null);
    } catch (error) {
      setUser(null);
      setSessionError(error instanceof Error ? error.message : 'Could not connect to Atlaso.');
    } finally {
      setIsCheckingSession(false);
    }
  };

  useEffect(() => { void refreshSession(); }, []);

  const handleSignOut = async () => {
    try {
      await api.signOut();
    } finally {
      setUser(null);
      useArchitectureStore.getState().loadCanvas([], [], { x: 0, y: 0, zoom: 1 });
      useArchitectureStore.getState().setActiveArchitecture(null, null);
      localStorage.removeItem('atlaso.activeArchitectureId');
      localStorage.removeItem('atlaso.activeProjectId');
    }
  };

  if (isCheckingSession) return <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-sm text-slate-400">Checking your session…</div>;
  if (!user) return <div className="relative"><AuthScreen onAuthenticated={() => { void refreshSession(); }} />{sessionError && <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-500/20 bg-[#17130c] px-4 py-3 text-sm text-amber-200 shadow-xl"><span>{sessionError}</span><button onClick={() => { setIsCheckingSession(true); void refreshSession(); }} className="font-medium text-amber-100 underline underline-offset-2">Retry</button></div>}</div>;

  return <ArchitectureWorkspace user={user} onSignOut={() => void handleSignOut()} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
