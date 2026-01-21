import { useState } from 'react';
import { SystemConstraints, AnalysisResult, Suggestion, CanvasNode } from '../../types';
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

export function RightPanel({ constraints, onConstraintsChange, analysis, suggestions, nodes }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('constraints');

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: 'constraints', label: 'Constraints' },
    { id: 'analysis', label: 'Analysis', badge: analysis?.bottlenecks.length },
    { id: 'suggestions', label: 'Suggestions', badge: suggestions.length },
    { id: 'assumptions', label: 'Assumptions', badge: analysis?.assumptions?.length },
  ];

  return (
    <div className="w-96 h-full bg-slate-900 border-l border-slate-700/50 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                ? 'text-slate-200 border-b-2 border-blue-500 bg-slate-800/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
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
