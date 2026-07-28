import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { AnalysisResult, Suggestion } from '../../types';

interface BottomPanelProps {
  analysis: AnalysisResult | null;
  suggestions: Suggestion[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

export function BottomPanel({
  analysis,
  suggestions,
  isOpen,
  setIsOpen,
  isExpanded,
  setIsExpanded,
}: BottomPanelProps) {
  void analysis;
  void suggestions;
  void isOpen;
  void setIsOpen;
  void isExpanded;
  void setIsExpanded;
  const [activeTab, setActiveTab] = useState<'validation' | 'simulation' | 'logs' | 'ai'>('validation');

  const tabs: Array<{ id: 'validation' | 'simulation' | 'logs' | 'ai'; label: string; badge?: number }> = [
    { id: 'validation', label: 'Validation', badge: 2 },
    { id: 'simulation', label: 'Simulation' },
    { id: 'logs', label: 'Logs' },
    { id: 'ai', label: 'AI Suggestions', badge: 3 },
  ];

  return (
    <div className="h-64 bg-[#09090b]/95 border-t border-white/5 flex flex-col shrink-0">
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 h-full px-4 text-xs font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                tab.id === 'validation' ? 'bg-red-500 text-white' : 'bg-slate-700 text-white'
              }`}>
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-[1.2] p-4 overflow-y-auto custom-scrollbar border-r border-white/5 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-slate-200">Redis memory might be insufficient for 1M concurrent users</div>
              <div className="text-[10px] text-slate-500 mt-1">Estimated required memory: 24GB - 32GB</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
            <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-slate-200">Add database read replicas for better availability</div>
              <div className="text-[10px] text-slate-500 mt-1">Current setup has single point of write failure risk</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-400">All services have proper load balancing configured</div>
            </div>
          </div>
        </div>

        <div className="flex-2 p-4 border-r border-white/5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-xs font-semibold text-slate-200">Load Simulation Results</h3>
            <div className="flex items-center gap-4 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Latency (ms)</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Throughput (RPS)</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Error Rate (%)</div>
            </div>
          </div>
          
          <div className="flex-1 relative mt-2 w-full h-full">
             <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-slate-500 z-10 font-mono">
               <span>150ms</span>
               <span>100ms</span>
               <span>50ms</span>
               <span>0ms</span>
             </div>
             
             <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-slate-500 z-10 font-mono text-right">
               <span>600k</span>
               <span>400k</span>
               <span>200k</span>
               <span>0</span>
             </div>

             <div className="absolute left-8 right-8 top-1 bottom-6 flex flex-col justify-between">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="w-full h-px bg-white/5" />
               ))}
             </div>

             <svg className="absolute left-8 right-8 top-1 bottom-6 w-[calc(100%-4rem)] h-[calc(100%-1.5rem)] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
               <path d="M 0 90 L 25 70 L 50 60 L 75 45 L 100 20" fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
               <path d="M 0 95 L 25 85 L 50 80 L 75 60 L 100 40" fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
               <path d="M 0 98 L 25 98 L 50 95 L 75 90 L 100 70" fill="none" stroke="#ef4444" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
             </svg>

             <div className="absolute left-8 right-8 bottom-0 flex justify-between text-[9px] text-slate-500 font-mono">
               <span>1k</span>
               <span>10k</span>
               <span>100k</span>
               <span>500k</span>
               <span>1M</span>
             </div>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-xs font-semibold">System handles 1M RPS</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">P95 Latency</span>
              <span className="text-xs text-slate-200 font-mono">89 ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Throughput</span>
              <span className="text-xs text-slate-200 font-mono">980,000 RPS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Error Rate</span>
              <span className="text-xs text-slate-200 font-mono">0.12%</span>
            </div>
            <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-slate-400">Estimated Cost</span>
              <span className="text-xs text-slate-200 font-mono">$3,420 / month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}