import { useState } from 'react';
import { X, Save } from '../../lib/icons';

interface SaveArchitectureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, type: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT') => void;
    isLoading?: boolean;
    defaultName?: string;
    defaultDescription?: string;
    projectName?: string;
    defaultType?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT';
}

export function SaveArchitectureModal({ isOpen, onClose, onSave, isLoading, defaultName = '', defaultDescription = '', projectName, defaultType = 'HLD' }: SaveArchitectureModalProps) {
    const [name, setName] = useState(defaultName);
    const [description, setDescription] = useState(defaultDescription);
    const [type, setType] = useState<'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT'>(defaultType);

    if (!isOpen)
        return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim())
            onSave(name.trim(), description.trim(), type);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-xl w-full max-w-md border border-slate-700">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Save className="w-5 h-5 text-green-400" />
                        <div><h2 className="text-lg font-semibold text-slate-100">Save Architecture</h2>{projectName && <p className="text-xs text-slate-400">Project: {projectName}</p>}</div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="mb-2 block text-sm font-medium text-slate-300">Architecture type</label><select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100"><option value="HLD">High level design</option><option value="LLD">Low level design</option><option value="DATABASE">Database</option><option value="DEPLOYMENT">Deployment</option></select></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Architecture"
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A brief description of this architecture..."
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
