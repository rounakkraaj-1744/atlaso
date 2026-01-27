import { useState } from 'react';
import { X, Folder, Trash2, Clock, GitBranch } from 'lucide-react';
import { useArchitectures, useDeleteArchitecture } from '../../features/architecture/hooks/useArchitectures';
import type { Architecture } from '../../lib/api';

interface LoadArchitectureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (architecture: Architecture) => void;
}

export function LoadArchitectureModal({ isOpen, onClose, onLoad }: LoadArchitectureModalProps) {
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useArchitectures(page, 10);
    const deleteArchitecture = useDeleteArchitecture();

    if (!isOpen)
        return null;

    const handleLoad = (arch: Architecture) => {
        onLoad(arch);
        onClose();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this architecture?'))
            await deleteArchitecture.mutateAsync(id);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-700">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-slate-100">Load Architecture</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12 text-red-400">
                            Failed to load architectures. Is the backend running?
                        </div>
                    )}

                    {data?.data && data.data.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No saved architectures yet. Create one using the Save button.
                        </div>
                    )}

                    {data?.data && data.data.length > 0 && (
                        <div className="space-y-3">
                            {data.data.map((arch) => (
                                <div
                                    key={arch.id}
                                    onClick={() => handleLoad(arch)}
                                    className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-slate-100">{arch.name}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{arch.description || 'No description'}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(arch.updatedAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <GitBranch className="w-3 h-3" />
                                                v{arch.version}
                                            </span>
                                            <span>{arch.nodes.length} nodes</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, arch.id)}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-slate-700">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm bg-slate-800 rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-400">
                            Page {page} of {data.pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= data.pagination.totalPages}
                            className="px-3 py-1 text-sm bg-slate-800 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}