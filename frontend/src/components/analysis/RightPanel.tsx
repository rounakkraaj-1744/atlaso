import { useState } from 'react';
import { SystemConstraints, AnalysisResult, Suggestion, CanvasNode } from '../../types';
import { AlertTriangle, CheckCircle2, XCircle, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';

interface RightPanelProps {
  constraints: SystemConstraints;
  onConstraintsChange: (constraints: SystemConstraints) => void;
  analysis: AnalysisResult | null;
  suggestions: Suggestion[];
  nodes: CanvasNode[];
}

type TabType = 'constraints' | 'analysis' | 'suggestions';

export function RightPanel({ constraints, onConstraintsChange, analysis, suggestions, nodes }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('constraints');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'constraints', label: 'Constraints' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'suggestions', label: 'Suggestions' },
  ];

  return (
    <div className="w-96 h-full bg-slate-900 border-l border-slate-700/50 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'text-slate-200 border-b-2 border-blue-500 bg-slate-800/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'constraints' && (
          <ConstraintsTab constraints={constraints} onChange={onConstraintsChange} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab analysis={analysis} nodes={nodes} />
        )}
        {activeTab === 'suggestions' && (
          <SuggestionsTab suggestions={suggestions} />
        )}
      </div>
    </div>
  );
}

function ConstraintsTab({
  constraints,
  onChange,
}: {
  constraints: SystemConstraints;
  onChange: (c: SystemConstraints) => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Average RPS
        </label>
        <input
          type="number"
          value={constraints.avgRPS}
          onChange={(e) => onChange({ ...constraints, avgRPS: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">Sustained requests per second</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Peak/Burst RPS
        </label>
        <input
          type="number"
          value={constraints.peakRPS}
          onChange={(e) => onChange({ ...constraints, peakRPS: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">Maximum spike traffic</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Read/Write Ratio
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={constraints.readWriteRatio}
            onChange={(e) => onChange({ ...constraints, readWriteRatio: parseInt(e.target.value) })}
            className="flex-1 accent-blue-500"
          />
          <span className="text-sm font-mono text-slate-300 w-16 text-right">
            {constraints.readWriteRatio}% R
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {constraints.readWriteRatio}% reads, {100 - constraints.readWriteRatio}% writes
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Payload Size (KB)
        </label>
        <input
          type="number"
          value={constraints.payloadSize}
          onChange={(e) => onChange({ ...constraints, payloadSize: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">Average request/response size</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          SLA Latency (ms, p95)
        </label>
        <input
          type="number"
          value={constraints.slaLatency}
          onChange={(e) => onChange({ ...constraints, slaLatency: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">Maximum acceptable p95 latency</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Retry Attempts
        </label>
        <input
          type="number"
          value={constraints.retryAttempts}
          onChange={(e) => onChange({ ...constraints, retryAttempts: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">Max retry attempts on failure</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Rate Limit (RPS)
        </label>
        <input
          type="number"
          value={constraints.rateLimitRPS}
          onChange={(e) => onChange({ ...constraints, rateLimitRPS: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">System-wide rate limiting threshold</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Consumer Lag Tolerance (sec)
        </label>
        <input
          type="number"
          value={constraints.consumerLagTolerance}
          onChange={(e) => onChange({ ...constraints, consumerLagTolerance: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-slate-500 mt-1">Max acceptable queue/stream lag</div>
      </div>
    </div>
  );
}

function AnalysisTab({ analysis, nodes }: { analysis: AnalysisResult | null; nodes: CanvasNode[] }) {
  if (!analysis) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-500 py-12">
          {nodes.length === 0 ? (
            <>
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Add components to begin analysis</p>
            </>
          ) : (
            <>
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Configure constraints and run analysis</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const verdictConfig = {
    pass: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      label: 'System can handle load',
    },
    risky: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: 'System is at risk under peak load',
    },
    fail: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'System will fail under load',
    },
  };

  const config = verdictConfig[analysis.verdict];
  const VerdictIcon = config.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Overall Verdict */}
      <div className={`p-4 rounded-lg border ${config.border} ${config.bg}`}>
        <div className="flex items-center gap-3 mb-2">
          <VerdictIcon className={`w-6 h-6 ${config.color}`} />
          <h3 className="font-semibold text-slate-200 uppercase tracking-wide text-sm">
            Overall Verdict
          </h3>
        </div>
        <p className={`${config.color} font-medium`}>{config.label}</p>
      </div>

      {/* Bottlenecks */}
      {analysis.bottlenecks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Bottleneck Components
          </h3>
          <div className="space-y-2">
            {analysis.bottlenecks.map((bottleneck, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${bottleneck.severity === 'high'
                    ? 'border-red-500/30 bg-red-500/10'
                    : bottleneck.severity === 'medium'
                      ? 'border-orange-500/30 bg-orange-500/10'
                      : 'border-yellow-500/30 bg-yellow-500/10'
                  }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 ${bottleneck.severity === 'high'
                        ? 'text-red-400'
                        : bottleneck.severity === 'medium'
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 mb-1">
                      {bottleneck.nodeName}
                    </div>
                    <div className="text-xs text-slate-400">{bottleneck.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            System Warnings
          </h3>
          <div className="space-y-2">
            {analysis.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10"
              >
                <p className="text-sm text-slate-300">{warning.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionsTab({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-500 py-12">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No suggestions at this time</p>
          <p className="text-xs text-slate-600 mt-2">System appears optimal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={`p-4 rounded-lg border ${suggestion.impact === 'high'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : suggestion.impact === 'medium'
                ? 'border-blue-500/30 bg-blue-500/5'
                : 'border-slate-700/50 bg-slate-800/30'
            }`}
        >
          <div className="flex items-start gap-3 mb-3">
            <Lightbulb
              className={`w-5 h-5 mt-0.5 ${suggestion.impact === 'high'
                  ? 'text-emerald-400'
                  : suggestion.impact === 'medium'
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`}
            />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-200 mb-2">{suggestion.title}</h4>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Why it helps
                  </div>
                  <p className="text-sm text-slate-400">{suggestion.why}</p>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Tradeoff
                  </div>
                  <p className="text-sm text-slate-400">{suggestion.tradeoff}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-slate-500">Impact</span>
            <span
              className={`px-2 py-1 rounded ${suggestion.impact === 'high'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : suggestion.impact === 'medium'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
            >
              {suggestion.impact.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
