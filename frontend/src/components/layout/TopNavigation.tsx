import { useState } from 'react';
import { ChevronDown, Layers3, Play, Download, Moon, Command, Undo2, Redo2, Loader2, Upload } from 'lucide-react';
import type { CanvasNode } from '../../types';
import { ProviderMappingDropdown } from '../modals/ProviderMappingModal';

interface TopNavigationProps {
  nodes: CanvasNode[];
  onRunAnalysis: () => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (open: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
  projectName?: string;
  isSimulating?: boolean;
}

export function TopNavigation({ nodes, onRunAnalysis, isLeftPanelOpen, setIsLeftPanelOpen, isRightPanelOpen, setIsRightPanelOpen, projectName = "Untitled Architecture", isSimulating = false }: TopNavigationProps) {
  void isLeftPanelOpen;
  void setIsLeftPanelOpen;
  void isRightPanelOpen;
  void setIsRightPanelOpen;
  const [activeProfile, setActiveProfile] = useState('AWS');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const profiles = ['Generic', 'AWS', 'Azure', 'Google Cloud', 'Cloudflare', 'Civo'];

  return (
    <header className="h-14 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-40 relative">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Atlaso</span>
        </div>

        <div className="w-px h-4 bg-white/10 hidden md:block"></div>

        <div className="hidden md:flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-white/5">
          {projectName}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-50">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-center flex-1 max-w-md px-4">
        <button className="flex items-center justify-between w-full h-8 px-3 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 hover:text-slate-300 transition-all">
          <span className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5" />
            Search or run command...
          </span>
          <div className="flex items-center gap-1 font-mono text-[10px] opacity-70">
            <kbd className="px-1.5 py-0.5 bg-black/20 rounded">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-black/20 rounded">K</kbd>
          </div>
        </button>
      </div>

      <div className="hidden xl:flex items-center gap-2 mr-3">
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5"
          >
            <span className="text-slate-500">Active Profile</span>
            <span className="font-medium text-slate-100">{activeProfile}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
          {showProfileMenu && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f16]/95 shadow-2xl backdrop-blur-2xl">
              {profiles.map((profile) => (
                <button
                  key={profile}
                  onClick={() => {
                    setActiveProfile(profile);
                    setShowProfileMenu(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-white/5 ${
                    activeProfile === profile ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  <span>{profile}</span>
                  {activeProfile === profile && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProviderDropdown((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-blue-500/40 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:-translate-y-0.5 hover:bg-blue-500/10 hover:text-white"
          >
            <Layers3 className="h-3.5 w-3.5 text-blue-400" />
            Apply Provider Mapping
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <ProviderMappingDropdown isOpen={showProviderDropdown} onClose={() => setShowProviderDropdown(false)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors tooltip-trigger" title="Undo (⌘Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors tooltip-trigger" title="Redo (⇧⌘Z)">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10 hidden md:block mx-1"></div>

        {/* Avatar Stack */}
        <div className="hidden md:flex items-center -space-x-2 mr-2">
          <div className="w-6 h-6 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden z-40">
            <img src="https://i.pravatar.cc/100?img=1" alt="User A" className="w-full h-full object-cover" />
          </div>
          <div className="w-6 h-6 rounded-full border border-slate-900 bg-blue-600 flex items-center justify-center text-[10px] font-semibold text-white z-30">
            R
          </div>
          <div className="w-6 h-6 rounded-full border border-slate-900 bg-emerald-600 flex items-center justify-center text-[10px] font-semibold text-white z-20">
            S
          </div>
          <div className="w-6 h-6 rounded-full border border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-medium text-slate-300 z-10">
            +3
          </div>
        </div>

        <button className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-transparent hover:bg-white/5 border border-white/10 rounded-md transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Share
        </button>

        <button onClick={onRunAnalysis} disabled={nodes.length === 0 || isSimulating} className="group flex items-center gap-2 px-4 py-1.5 bg-[#2563eb] rounded-full text-white text-xs font-medium hover:bg-blue-500 transition-all shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_-3px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ml-1">
          {isSimulating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current opacity-90" />
          )}
          <span>Simulate</span>
        </button>

        <button className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-transparent hover:bg-white/5 border border-white/10 rounded-md transition-colors ml-1">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <div className="w-px h-4 bg-white/10 mx-1"></div>

        <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
          <Moon className="w-4 h-4" />
        </button>

        <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[11px] font-semibold text-white cursor-pointer ml-1">
          RK
        </div>
      </div>
    </header>
  );
}
