import { useState } from 'react';
import type { SystemConstraints, AnalysisResult, Suggestion, CanvasNode, Connection } from '../../types';
import { ConstraintsTab } from './ConstraintsTab';

interface RightPanelProps {
  constraints: SystemConstraints;
  onConstraintsChange: (constraints: SystemConstraints) => void;
  analysis: AnalysisResult | null;
  suggestions: Suggestion[];
  nodes: CanvasNode[];
  selectedNode?: CanvasNode | null;
  setSelectedNode?: (node: CanvasNode | null) => void;
  onUpdateNode?: (node: CanvasNode) => void;
  selectedConnection?: Connection | null;
  setSelectedConnection?: (conn: Connection | null) => void;
  onUpdateConnection?: (conn: Connection) => void;
  onDeleteConnection?: (id: string) => void;
  onOpenReplaceTechnology?: (node: CanvasNode) => void;
}

import { ChevronDown } from 'lucide-react';
import { ComponentIconRenderer } from '../canvas/ComponentIconRenderer';
import { componentRegistry } from '../../features/registry/data/components';

type TabType = 'overview' | 'configuration' | 'performance' | 'cost';

export function RightPanel({
  constraints,
  onConstraintsChange,
  analysis,
  suggestions,
  nodes,
  selectedNode,
  setSelectedNode,
  onUpdateNode,
  selectedConnection,
  setSelectedConnection,
  onUpdateConnection,
  onDeleteConnection,
  onOpenReplaceTechnology,
}: RightPanelProps) {
  void analysis;
  void suggestions;
  void setSelectedNode;
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'performance', label: 'Performance' },
    { id: 'cost', label: 'Cost' },
  ];

  const handleUpdateNodeConfig = (updates: any) => {
    if (selectedNode && onUpdateNode) {
      onUpdateNode({ ...selectedNode, config: { ...selectedNode.config, ...updates } });
    }
  };

  const handleUpdateConnectionType = (type: 'sync' | 'async') => {
    if (selectedConnection && onUpdateConnection) {
      onUpdateConnection({ ...selectedConnection, type });
    }
  };

  const handleUpdateConnectionToggle = (field: 'hasRetry' | 'hasBuffer', value: boolean) => {
    if (selectedConnection && onUpdateConnection) {
      onUpdateConnection({ ...selectedConnection, [field]: value });
    }
  };

  const renderTabs = () => (
    <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar shrink-0 px-2 mt-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 py-2.5 text-xs font-medium transition-all relative whitespace-nowrap ${
            activeTab === tab.id
              ? 'text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-md'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );

  if (selectedNode) {
    const registryItem = componentRegistry[selectedNode.type];

    return (
      <div className="h-full bg-[#09090b]/95 border-l border-white/5 flex flex-col custom-scrollbar">
        {renderTabs()}

        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/5 rounded-md border border-white/5">
              {registryItem && (
                <ComponentIconRenderer type={registryItem.type} vendor={registryItem.vendor} size={24} />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-200 text-sm tracking-tight">{selectedNode.config.name}</h2>
              <div className="text-xs text-slate-500 mt-0.5">{selectedNode.providerMapping?.technology || registryItem?.description || selectedNode.type}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-400">{selectedNode.providerMapping?.mappingStatus === 'manual' ? 'Manual' : 'Custom'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Memory</span>
            <div className="flex items-center gap-2">
              <input type="text" value="8" readOnly className="w-16 bg-transparent border-b border-white/10 text-xs text-white text-right focus:outline-none" />
              <span className="text-xs text-slate-500">GB</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Replication</span>
            <select className="bg-transparent border-b border-white/10 text-xs text-white text-right focus:outline-none pb-1 appearance-none">
              <option>3 replicas</option>
              <option>1 replica</option>
              <option>5 replicas</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Cluster Mode</span>
            <div className="w-7 h-4 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Persistence</span>
            <select className="bg-transparent border-b border-white/10 text-xs text-white text-right focus:outline-none pb-1 appearance-none">
              <option>AOF</option>
              <option>RDB</option>
              <option>None</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Eviction Policy</span>
            <select className="bg-transparent border-b border-white/10 text-xs text-white text-right focus:outline-none pb-1 appearance-none">
              <option>LRU</option>
              <option>LFU</option>
              <option>No Eviction</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Expected Throughput</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={selectedNode.config.throughput}
                onChange={(e) => handleUpdateNodeConfig({ throughput: parseInt(e.target.value) || 0 })}
                className="w-20 bg-transparent border-b border-white/10 text-xs text-white font-mono text-right focus:outline-none"
              />
              <span className="text-xs text-slate-500">ops/sec</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Average Latency</span>
            <div className="flex items-center gap-2">
              <input type="text" value="1 - 2" readOnly className="w-16 bg-transparent border-b border-white/10 text-xs text-white text-right focus:outline-none font-mono" />
              <span className="text-xs text-slate-500">ms</span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5">
            <button className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-4">
              <ChevronDown className="w-3.5 h-3.5" />
              Advanced Settings
            </button>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-slate-400">Memory Usage</span>
                  <span className="text-slate-200">62%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-slate-400">Hit Ratio</span>
                  <span className="text-slate-200">95%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-slate-400">Connections</span>
                  <span className="text-slate-200">12,420 / 20,000</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Provider Mapping</h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-400">Active</span>
            </div>

            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Technology</div>
                  <div className="mt-1 text-sm text-slate-200">{selectedNode.providerMapping?.technology || 'Supabase Auth'}</div>
                </div>
                <button
                  onClick={() => onOpenReplaceTechnology?.(selectedNode)}
                  className="rounded-md border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/10"
                >
                  Replace
                </button>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Current Provider</div>
                <div className="mt-1 text-sm text-slate-200">{selectedNode.providerMapping?.provider || 'Supabase'}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Mapping Status</div>
                  <div className="mt-1 text-sm text-emerald-400">{selectedNode.providerMapping?.mappingStatus === 'manual' ? 'Manual Selection' : 'Custom Selection'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenReplaceTechnology?.(selectedNode)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5"
                >
                  Replace Technology
                </button>
                <button className="flex-1 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5">
                  Reset to Profile Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedConnection) {
    const source = nodes.find(n => n.id === selectedConnection.sourceId);
    const target = nodes.find(n => n.id === selectedConnection.targetId);

    return (
      <div className="h-full bg-slate-900/95 backdrop-blur-2xl flex flex-col custom-scrollbar">
        <div className="px-5 py-4 border-b border-white/5 sticky top-0 bg-slate-900/95 z-10">
          <h2 className="font-semibold text-slate-200 text-sm">Connection Properties</h2>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {source?.config.name || 'Source'} → {target?.config.name || 'Target'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Type
            </label>
            <select
              value={selectedConnection.type}
              onChange={(e) => handleUpdateConnectionType(e.target.value as 'sync' | 'async')}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="sync">Synchronous (blocking)</option>
              <option value="async">Asynchronous (non-blocking)</option>
            </select>
            <div className="text-[10px] text-slate-500 mt-1.5">
              Sync adds latency to request path; async decouples components
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="hasRetry" checked={selectedConnection.hasRetry} onChange={(e) => handleUpdateConnectionToggle('hasRetry', e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black/20 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"/>
            <label htmlFor="hasRetry" className="text-sm text-slate-300 select-none cursor-pointer">
              Enable retry mechanism
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="hasBuffer" checked={selectedConnection.hasBuffer} onChange={(e) => handleUpdateConnectionToggle('hasBuffer', e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black/20 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"/>
            <label htmlFor="hasBuffer" className="text-sm text-slate-300 select-none cursor-pointer">
              Use buffering/queue
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-white/5">
          <button onClick={() => {
              if (onDeleteConnection) 
                onDeleteConnection(selectedConnection.id);
              if (setSelectedConnection) 
                setSelectedConnection(null);
            }} className="w-full px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors" >
            Delete Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#09090b]/95 border-l border-white/5 flex flex-col">
      {renderTabs()}

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {activeTab === 'overview' && (
          <ConstraintsTab constraints={constraints} onConstraintsChange={onConstraintsChange} />
        )}
      </div>
    </div>
  );
}