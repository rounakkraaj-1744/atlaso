import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Layers3, Play, Save, FolderOpen, FolderPlus, Undo2, Redo2, Download, Upload, Moon, Check } from '../../lib/icons';
import type { CanvasNode } from '../../types';
import { ProviderMappingDropdown } from '../modals/ProviderMappingModal';
import type { AuthUser, Project } from '../../lib/api';

interface TopNavigationProps {
  nodes: CanvasNode[];
  onRunAnalysis: () => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (open: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
  projectName?: string;
  architectureName?: string;
  isSimulating?: boolean;
  user?: AuthUser;
  onSignOut?: () => void;
  projects?: Project[];
  activeProjectId?: string;
  onProjectChange?: (id: string) => void;
  onNewProject?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

type MenuName = 'file' | 'insert';

const menuButton = 'flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] text-slate-300 transition-colors hover:bg-white/[.08] hover:text-white';
const menuItem = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[.08] disabled:cursor-not-allowed disabled:opacity-40';

export function TopNavigation({ nodes, onRunAnalysis, isLeftPanelOpen, setIsLeftPanelOpen, isRightPanelOpen, setIsRightPanelOpen, projectName = 'Untitled Project', architectureName = 'Untitled Architecture', isSimulating = false, user, onSignOut, projects = [], activeProjectId = '', onProjectChange, onNewProject, onSave, onLoad, onUndo, onRedo, onExport, onShare }: TopNavigationProps) {
  void isLeftPanelOpen;
  void setIsLeftPanelOpen;
  void isRightPanelOpen;
  void setIsRightPanelOpen;
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const toggleMenu = (name: MenuName) => setOpenMenu(current => current === name ? null : name);
  const shortcut = (mac: string, windows: string) => isMac ? mac : windows;

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (!modifier || event.altKey) return;
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (isTyping && event.key.toLowerCase() !== 's') return;
      const key = event.key.toLowerCase();
      const handlers: Record<string, (() => void) | undefined> = {
        s: onSave,
        o: onLoad,
        n: onNewProject,
        e: onExport,
        z: event.shiftKey ? onRedo : onUndo,
        y: onRedo,
      };
      const handler = event.shiftKey && key === 'u' ? onShare : key === 'Enter' ? onRunAnalysis : handlers[key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, [isMac, onSave, onLoad, onNewProject, onExport, onUndo, onRedo, onRunAnalysis, onShare]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpenMenu(null);
        setShowProjects(false);
        setShowProviderDropdown(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setShowProjects(false);
        setShowProviderDropdown(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const renderMenu = (name: MenuName, label: string, content: React.ReactNode) => (
    <div className="relative">
      <button type="button" className={`${menuButton} ${openMenu === name ? 'bg-white/[.08] text-white' : ''}`} aria-expanded={openMenu === name} onClick={() => toggleMenu(name)}>
        {label}<ChevronDown className="h-3.5 w-3.5 text-slate-500" />
      </button>
      {openMenu === name && <div className="absolute left-0 top-[calc(100%+7px)] z-50 w-56 rounded-lg border border-white/10 bg-[#11151d] p-1.5 shadow-2xl" onClick={() => setOpenMenu(null)}>{content}</div>}
    </div>
  );

  return (
    <header ref={rootRef} className="relative z-40 flex h-14 shrink-0 items-center border-b border-white/[.07] bg-[#090c12]/95 px-3 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-base text-white">ϟ</span>
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">Atlaso</span>
        </div>
        <div className="hidden h-5 w-px bg-white/10 sm:block" />
        <div className="hidden min-w-0 items-center gap-1.5 text-xs text-slate-400 sm:flex">
          {projects.length > 0 ? <div className="relative"><button type="button" aria-label="Select project" aria-expanded={showProjects} onClick={() => setShowProjects(value => !value)} className="flex max-w-36 items-center gap-1 truncate rounded-md px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/[.06]">{projects.find(project => project.id === activeProjectId)?.name ?? 'Select project'}<ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" /></button>{showProjects && <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-72 w-56 overflow-y-auto rounded-lg border border-white/10 bg-[#11151d] p-1.5 shadow-2xl">{projects.map(project => <button key={project.id} type="button" onClick={() => { onProjectChange?.(project.id); setShowProjects(false); }} className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[.08]"><span className="truncate">{project.name}</span>{project.id === activeProjectId && <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />}</button>)}</div>}</div> : <span className="max-w-28 truncate">{projectName}</span>}
          <span className="text-slate-600">/</span><span className="max-w-40 truncate text-slate-200">{architectureName}</span>
        </div>
      </div>

      <nav className="ml-3 flex items-center gap-0.5 sm:ml-6" aria-label="Architecture menu">
        {renderMenu('file', 'File', <>
          <button type="button" className={menuItem} onClick={onNewProject}><FolderPlus className="h-4 w-4 text-slate-400" />New project<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⌘N', 'Ctrl+N')}</kbd></button>
          <button type="button" className={menuItem} onClick={onLoad}><FolderOpen className="h-4 w-4 text-slate-400" />Open architecture…<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⌘O', 'Ctrl+O')}</kbd></button>
          <div className="my-1 border-t border-white/[.08]" />
          <button type="button" className={menuItem} onClick={onSave}><Save className="h-4 w-4 text-slate-400" />Save architecture<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⌘S', 'Ctrl+S')}</kbd></button>
          <button type="button" className={menuItem} onClick={onExport}><Download className="h-4 w-4 text-slate-400" />Export<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⌘E', 'Ctrl+E')}</kbd></button>
          <button type="button" className={menuItem} onClick={onShare}><Upload className="h-4 w-4 text-slate-400" />Share<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⇧⌘U', 'Ctrl+Shift+U')}</kbd></button>
          <div className="my-1 border-t border-white/[.08]" />
          <button type="button" className={menuItem} onClick={onUndo}><Undo2 className="h-4 w-4 text-slate-400" />Undo<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⌘Z', 'Ctrl+Z')}</kbd></button>
          <button type="button" className={menuItem} onClick={onRedo}><Redo2 className="h-4 w-4 text-slate-400" />Redo<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⇧⌘Z', 'Ctrl+Shift+Z')}</kbd></button>
          <button type="button" className={`${menuItem} sm:hidden`} disabled={nodes.length === 0 || isSimulating} onClick={onRunAnalysis}><Play className="h-4 w-4 text-blue-400" />{isSimulating ? 'Simulating…' : 'Simulate'}<kbd className="ml-auto text-[10px] text-slate-500">{shortcut('⌘↵', 'Ctrl+↵')}</kbd></button>
        </>)}
        {renderMenu('insert', 'Insert', <>
          <button type="button" className={menuItem} onClick={() => { setIsLeftPanelOpen(!isLeftPanelOpen); setOpenMenu(null); }}>Components</button>
          <button type="button" className={menuItem} onClick={() => { setIsRightPanelOpen(!isRightPanelOpen); setOpenMenu(null); }}>Analysis panel</button>
        </>)}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-1 sm:flex">
          <button type="button" onClick={onUndo} title={`Undo (${shortcut('⌘Z', 'Ctrl+Z')})`} aria-label="Undo" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[.08] hover:text-white"><Undo2 className="h-4 w-4" /></button>
          <button type="button" onClick={onRedo} title={`Redo (${shortcut('⇧⌘Z', 'Ctrl+Shift+Z')})`} aria-label="Redo" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[.08] hover:text-white"><Redo2 className="h-4 w-4" /></button>
        </div>
        <button type="button" disabled={nodes.length === 0 || isSimulating} onClick={onRunAnalysis} title={`Simulate (${shortcut('⌘Enter', 'Ctrl+Enter')})`} className="inline-flex h-8 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-3.5 w-3.5" />{isSimulating ? 'Simulating…' : 'Simulate'}<kbd className="hidden text-[10px] text-blue-100/70 lg:inline">{shortcut('⌘↵', 'Ctrl+↵')}</kbd></button>
        <div className="relative hidden sm:block">
          <button type="button" aria-expanded={showProviderDropdown} onClick={() => setShowProviderDropdown(value => !value)} className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-2.5 text-xs text-slate-300 transition-colors hover:bg-white/[.06] hover:text-white">
            <Layers3 className="h-3.5 w-3.5 text-blue-400" />Provider mapping<ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <ProviderMappingDropdown isOpen={showProviderDropdown} onClose={() => setShowProviderDropdown(false)} />
        </div>
        <button type="button" aria-label="Toggle theme" title="Toggle theme" className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[.08] hover:text-white sm:flex"><Moon className="h-4 w-4" /></button>
        <div className="group relative">
          <button type="button" title={user?.email ?? 'Account'} aria-label="Account" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-slate-700 text-[11px] font-semibold text-white">{(user?.name || user?.email || 'A').slice(0, 2).toUpperCase()}</button>
          <div className="invisible absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-xl border border-white/10 bg-[#0b0f16] p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
            <div className="truncate px-3 py-2 text-xs text-slate-400">{user?.email}</div>
            <button type="button" onClick={onSignOut} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">Sign out</button>
          </div>
        </div>
      </div>
    </header>
  );
}
