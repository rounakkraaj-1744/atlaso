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
import { ChevronUp, X } from './lib/icons';
import { useArchitectureStore } from './features/architecture/store';
import { useConstraintsStore } from './features/constraints/store';
import { useCreateArchitecture, useCreateProject, useProjects, useSaveCanvas } from './features/architecture/hooks/useArchitectures';
import type { Architecture, CanvasDocument, Project } from './lib/api';
import { TouchBackend } from 'react-dnd-touch-backend';
import { AuthScreen } from './components/auth/AuthScreen';
import { api, type AuthUser } from './lib/api';
import { ProjectOverview, WorkspaceHome } from './features/workspace/WorkspacePages';

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
const backendOptions = isTouchDevice() ? { enableMouseEvents: true } : {};
const EMPTY_PROJECTS: Project[] = [];

function ArchitectureWorkspace({ user, onSignOut, architectureId, navigate }: { user: AuthUser; onSignOut: () => void; architectureId: string; navigate: (path: string) => void }) {
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
  const [activeProjectId, setActiveProjectId] = useState('');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentArchitecture, setCurrentArchitecture] = useState<Architecture | null>(null);
  const handleViewportChange = useCallback((next: { x: number; y: number; zoom: number }) => {
    useArchitectureStore.getState().setViewport(next);
  }, []);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [canvasMountVersion, setCanvasMountVersion] = useState(0);
  const [showReplaceTechnologyModal, setShowReplaceTechnologyModal] = useState(false);
  const [replaceTechnologyNode, setReplaceTechnologyNode] = useState<CanvasNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(() => localStorage.getItem('atlaso.canvas.left-collapsed') === 'true');
  const [bottomPanelHeight, setBottomPanelHeight] = useState(() => Number(localStorage.getItem('atlaso.canvas.bottom-height')) || 256);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [isBottomPanelResizing, setIsBottomPanelResizing] = useState(false);

  useEffect(() => {
    if (!isBottomPanelResizing) return;
    const move = (event: PointerEvent) => setBottomPanelHeight(Math.min(Math.max(window.innerHeight - event.clientY, 120), window.innerHeight * 0.72));
    const stop = () => {
      setIsBottomPanelResizing(false);
      localStorage.setItem('atlaso.canvas.bottom-height', String(bottomPanelHeight));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [isBottomPanelResizing, bottomPanelHeight]);

  const toggleLeftPanelCollapsed = () => setLeftPanelCollapsed(value => {
    localStorage.setItem('atlaso.canvas.left-collapsed', String(!value));
    return !value;
  });

  useEffect(() => {
    setIsRestoring(true);
    setCurrentArchitecture(null);
    setActiveArchitecture(null, null);
    loadCanvas([], [], { x: 0, y: 0, zoom: 1 });
    void (async () => {
      try {
        const architecture = (await api.getArchitecture(architectureId)).data;
        if (!architecture) throw new Error('Architecture was not found.');
        const canvas = (await api.getCanvas(architecture.id)).data;
        if (!canvas) throw new Error('Canvas document was not found.');
        const document = canvas.document;
        setCurrentArchitecture(architecture);
        loadCanvas(document.nodes, document.connections, document.viewport);
        setCanvasDocumentProperties(document);
        const savedConstraints = document.metadata && typeof document.metadata === 'object' ? (document.metadata as Record<string, unknown>).constraints : undefined;
        if (savedConstraints && typeof savedConstraints === 'object') updateConstraints(savedConstraints as typeof constraints);
        setActiveProjectId(architecture.projectId ?? '');
        localStorage.setItem('atlaso.activeArchitectureId', architecture.id);
        setCanvasMountVersion((version) => version + 1);
        setActiveArchitecture(architecture.id, canvas.revision);
      } catch (error) {
        console.error('Could not restore architecture', error);
        toast.error(error instanceof Error ? error.message : 'Could not restore architecture.');
      } finally {
        setIsRestoring(false);
      }
    })();
  }, [architectureId, loadCanvas, setActiveArchitecture, updateConstraints, setCanvasDocumentProperties]);

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
    setShowLoadModal(false);
    navigate(`/architectures/${architecture.id}`);
  };

  const handleExport = () => {
    const exportData = {
      name: currentArchitecture?.name ?? 'Untitled Architecture',
      projectId: activeProjectId || null,
      nodes,
      connections,
      viewport,
      constraints,
    };
    const file = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(currentArchitecture?.name ?? 'architecture').trim().replace(/[^a-z0-9-_]+/gi, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Architecture exported');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: currentArchitecture?.name ?? 'Atlaso architecture', url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Architecture link copied');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') toast.error('Could not share architecture link');
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
      setCanvasMountVersion((version) => version + 1);
      loadCanvas([], [], { x: 0, y: 0, zoom: 1 });
      toast.success(`Created project ${response.data.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create project.');
    }
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

        <TopNavigation nodes={nodes} onRunAnalysis={handleRunAnalysis} isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen} isRightPanelOpen={isRightPanelOpen} setIsRightPanelOpen={setIsRightPanelOpen} projectName={projects.find((project) => project.id === activeProjectId)?.name ?? 'Loading project'} architectureName={currentArchitecture?.name ?? 'Loading architecture'} user={user} onSignOut={onSignOut} projects={projects} activeProjectId={activeProjectId} onProjectChange={(id) => navigate(`/projects/${id}`)} onNewProject={() => setShowCreateProjectModal(true)} onSave={() => setShowSaveModal(true)} onLoad={() => setShowLoadModal(true)} onExport={handleExport} onShare={() => void handleShare()} />

        <div className="flex-1 flex overflow-hidden relative z-10">
          {isRestoring && <div className="absolute inset-0 z-30 grid place-items-center bg-[#09090b]/75 backdrop-blur-sm"><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#11151d] px-5 py-4 text-sm text-slate-300"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400"/>Loading architecture…</div></div>}
          <AnimatePresence mode="wait">
            {(isLeftPanelOpen || window.innerWidth >= 768) && (
              <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                  fixed inset-y-0 left-0 z-30 w-72 bg-[#09090b]/95 border-r border-white/5 pt-14 md:pt-0
                  md:relative md:translate-x-0 md:inset-auto ${leftPanelCollapsed ? 'md:w-14' : 'md:w-72'}
                  ${isLeftPanelOpen ? 'block' : 'hidden md:block'}
                `}>
                <div className="h-full flex flex-col relative">
                  <button className="md:hidden absolute top-2 right-2 p-2 text-slate-400 hover:text-white z-10" onClick={() => setIsLeftPanelOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                  <ComponentRegistryPanel collapsed={leftPanelCollapsed} onToggleCollapse={toggleLeftPanelCollapsed} />
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
                <Canvas key={`${activeArchitectureId ?? 'unsaved'}-${canvasMountVersion}`} nodes={nodes} connections={connections} onAddNode={addNode} onUpdateNode={(node) => updateNode(node.id, node)} onNodePositionChange={setNodePosition} onDeleteNode={deleteNode} onDuplicateNode={duplicateNode} onUpdateConnection={(conn) => updateConnection(conn.id, conn)} onDeleteConnection={deleteConnection} onAddConnection={addConnection} selectedNode={selectedNode} setSelectedNode={setSelectedNode} selectedConnection={selectedConnection} setSelectedConnection={setSelectedConnection} initialViewport={viewport} onViewportChange={handleViewportChange}
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

            <div onPointerDown={() => setIsBottomPanelResizing(true)} className="group relative z-20 flex h-1.5 shrink-0 cursor-row-resize items-center justify-center border-t border-white/5 bg-[#09090b] hover:bg-blue-500/20" role="separator" aria-label="Resize analysis panel" aria-orientation="horizontal" aria-valuenow={bottomPanelHeight}>
              <div className="h-0.5 w-12 rounded-full bg-slate-700 transition-colors group-hover:bg-blue-400" />
            </div>
            {!bottomPanelOpen && <button type="button" onClick={() => setBottomPanelOpen(true)} className="flex h-8 shrink-0 items-center justify-center gap-2 border-t border-white/5 bg-[#09090b] text-xs text-slate-400 hover:text-white"><ChevronUp className="h-3.5 w-3.5" />Show analysis panel</button>}
            <div style={{ height: bottomPanelOpen ? `${bottomPanelHeight}px` : '0px' }} className="shrink-0 overflow-hidden transition-[height] duration-150">
              <BottomPanel analysis={analysis} suggestions={suggestions} isOpen={bottomPanelOpen} setIsOpen={setBottomPanelOpen} isExpanded={bottomPanelHeight > 420} setIsExpanded={(expanded) => setBottomPanelHeight(expanded ? Math.min(window.innerHeight * 0.65, 640) : 256)} />
            </div>
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
    </DndProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const navigate = useCallback((path: string) => { window.history.pushState({}, '', path); setPathname(path); }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

  const signOut = () => void handleSignOut();
  const architectureMatch = pathname.match(/^\/architectures\/([^/]+)\/?$/);
  const projectMatch = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (architectureMatch) return <ArchitectureWorkspace key={architectureMatch[1]} user={user} onSignOut={signOut} architectureId={decodeURIComponent(architectureMatch[1]!)} navigate={navigate} />;
  if (projectMatch) return <ProjectOverview user={user} onSignOut={signOut} navigate={navigate} projectId={decodeURIComponent(projectMatch[1]!)} />;
  if (pathname !== '/workspace' && pathname !== '/') navigate('/workspace');
  return <WorkspaceHome user={user} onSignOut={signOut} navigate={navigate} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-center" theme="dark" richColors />
    </QueryClientProvider>
  );
}
