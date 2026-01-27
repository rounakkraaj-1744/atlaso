import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Connection } from '../../types';

interface ConnectionDrawerProps {
  connection: Connection;
  onClose: () => void;
  onUpdate?: (connection: Connection) => void;
  onDelete?: () => void;
}

export function ConnectionDrawer({ connection, onClose, onUpdate, onDelete }: ConnectionDrawerProps) {
  const [config, setConfig] = useState(connection);

  const handleSave = () => {
    if (onUpdate)
      onUpdate(config);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete)
      onDelete();
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[90]" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-[100] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-200">Connection Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Connection Type
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as 'sync' | 'async' })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sync">Synchronous (blocking)</option>
              <option value="async">Asynchronous (non-blocking)</option>
            </select>
            <div className="text-xs text-slate-500 mt-1">
              Sync adds latency to request path; async decouples components
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasRetry"
              checked={config.hasRetry}
              onChange={(e) => setConfig({ ...config, hasRetry: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="hasRetry" className="text-sm text-slate-300">
              Enable retry mechanism
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasBuffer"
              checked={config.hasBuffer}
              onChange={(e) => setConfig({ ...config, hasBuffer: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="hasBuffer" className="text-sm text-slate-300">
              Use buffering/queue
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700/50 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
            >
              Save
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/20 transition-colors"
          >
            Delete Connection
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}