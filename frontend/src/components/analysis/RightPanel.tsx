import { useState } from 'react';
import type { SystemConstraints, AnalysisResult, Suggestion, CanvasNode } from '../../types';
import { ConstraintsTab } from './ConstraintsTab';
import { ResultsTab } from './ResultsTab';
import { SuggestionsTab } from './SuggestionsTab';
import { AssumptionsTab } from './AssumptionsTab';

interface RightPanelProps {
  constraints: SystemConstraints;
  onConstraintsChange: (constraints: SystemConstraints) => void;
  analysis: AnalysisResult | null;
  suggestions: Suggestion[];
  nodes: CanvasNode[];
}

type TabType = 'constraints' | 'analysis' | 'suggestions' | 'assumptions';

export function RightPanel({ constraints, onConstraintsChange, analysis, suggestions }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('constraints');

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: 'constraints', label: 'Constraints' },
    { id: 'analysis', label: 'Analysis', badge: analysis?.bottlenecks.length },
    { id: 'suggestions', label: 'Suggestions', badge: suggestions.length },
    { id: 'assumptions', label: 'Assumptions', badge: analysis?.assumptions?.length },
  ];

  return (
    <div className="h-full bg-transparent border-l border-white/5 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-3 py-2 text-xs font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
              ? 'text-white border-b-2 border-blue-500 bg-white/5'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600/20 border border-blue-500/50 text-blue-400 text-[9px] font-bold rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'constraints' && (
          <ConstraintsTab constraints={constraints} onConstraintsChange={onConstraintsChange} />
        )}
        {activeTab === 'analysis' && (
          <ResultsTab analysis={analysis} />
        )}
        {activeTab === 'suggestions' && (
          <SuggestionsTab suggestions={suggestions} />
        )}
        {activeTab === 'assumptions' && (
          <AssumptionsTab analysis={analysis} />
        )}
      </div>
    </div>
  );
}
