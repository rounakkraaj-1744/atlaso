import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CanvasNode } from '../../types';

interface NodeConfigDrawerProps {
  node: CanvasNode;
  onClose: () => void;
  onUpdate: (node: CanvasNode) => void;
}

export function NodeConfigDrawer({ node, onClose, onUpdate }: NodeConfigDrawerProps) {
  const [config, setConfig] = useState(node.config);

  const handleSave = () => {
    onUpdate({ ...node, config });
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-90" onClick={onClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-100 flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-slate-200">Configure Component</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Component Name
            </label>
            <input type="text" value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Throughput (RPS)
            </label>
            <input type="number" value={config.throughput} onChange={(e) => setConfig({ ...config, throughput: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
            <div className="text-xs text-slate-500 mt-1">Max requests per second this component can handle</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Latency (ms, p95)
            </label>
            <input type="number" value={config.latency} onChange={(e) => setConfig({ ...config, latency: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
            <div className="text-xs text-slate-500 mt-1">95th percentile latency under normal load</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Scaling Factor
            </label>
            <input type="number" step="0.1" value={config.scalingFactor} onChange={(e) => setConfig({ ...config, scalingFactor: parseFloat(e.target.value) || 1 })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
            <div className="text-xs text-slate-500 mt-1">Multiplier for horizontal scaling (instances/partitions)</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Failure Behavior
            </label>
            <div className="relative">
              <select value={config.failureBehavior} onChange={(e) => setConfig({ ...config, failureBehavior: e.target.value })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none" >
                <option value="retry">Retry with backoff</option>
                <option value="fail-fast">Fail fast</option>
                <option value="circuit-breaker">Circuit breaker</option>
                <option value="dead-letter">Dead letter queue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes / Assumptions
            </label>
            <textarea
              value={config.notes}
              onChange={(e) => setConfig({ ...config, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
              placeholder="Document key assumptions or constraints..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-colors" >
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20" >
            Save Changes
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}