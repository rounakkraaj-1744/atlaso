import { useState } from 'react';
import { ChevronDown } from '../../lib/icons';
import type { AnalysisResult, Suggestion } from '../../types';

interface BottomPanelProps {
  analysis: AnalysisResult | null;
  suggestions: Suggestion[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

export function BottomPanel({ analysis, suggestions, isOpen, setIsOpen, isExpanded, setIsExpanded }: BottomPanelProps) {
  void setIsOpen;
  void isExpanded;
  void setIsExpanded;
  const [activeTab, setActiveTab] = useState<'validation' | 'simulation' | 'logs' | 'ai'>('validation');
  const validationCount = analysis?.bottlenecks.length ?? 0;
  const tabs = [
    { id: 'validation' as const, label: 'Validation', badge: validationCount },
    { id: 'simulation' as const, label: 'Simulation' },
    { id: 'logs' as const, label: 'Logs' },
    { id: 'ai' as const, label: 'AI Suggestions', badge: suggestions.length },
  ];

  if (!isOpen) 
    return null;

  return (
    <div className={`shrink-0 border-t border-white/5 bg-[#09090b]/95 ${isExpanded ? 'h-[min(70vh,36rem)]' : 'h-64'} flex flex-col`}>
      <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/5 px-4">
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Collapse bottom panel" title="Collapse panel" className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-white/5 hover:text-white"><ChevronDown className="h-4 w-4" /></button>
        {tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`relative flex h-full items-center gap-2 whitespace-nowrap px-4 text-xs font-medium transition-colors ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
          {tab.label}{Boolean(tab.badge) && <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-white">{tab.badge}</span>}
          {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-blue-500" />}
        </button>)}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center">
        {activeTab === 'validation' && <p className="text-sm text-slate-500">{analysis ? validationCount ? `${validationCount} potential bottleneck${validationCount === 1 ? '' : 's'} found.` : 'No bottlenecks found in the current analysis.' : 'Run analysis to see architecture validation results.'}</p>}
        {activeTab === 'simulation' && <p className="text-sm text-slate-500">Simulation results will appear here after a simulation is run.</p>}
        {activeTab === 'logs' && <p className="text-sm text-slate-500">No logs yet.</p>}
        {activeTab === 'ai' && <p className="text-sm text-slate-500">{suggestions.length ? `${suggestions.length} suggestions are available in the Suggestions panel.` : 'No suggestions yet. Run analysis to generate suggestions.'}</p>}
      </div>
    </div>
  );
}
