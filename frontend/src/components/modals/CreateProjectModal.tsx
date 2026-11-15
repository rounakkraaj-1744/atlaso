import { useState } from 'react';
import { FolderPlus, X } from '../../lib/icons';

interface CreateProjectModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export function CreateProjectModal({ isOpen, isLoading, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
    <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) onCreate(name.trim(), description.trim()); }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10131a] p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><FolderPlus className="h-5 w-5 text-blue-400"/><h2 className="text-lg font-semibold text-white">Create project</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5"><X className="h-4 w-4"/></button></div>
      <label className="mb-4 block text-sm text-slate-300">Project name<input autoFocus required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="Payments platform"/></label>
      <label className="mb-6 block text-sm text-slate-300">Description<textarea maxLength={10000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-blue-500" rows={3} placeholder="What are you designing?"/></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button><button disabled={!name.trim() || isLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{isLoading ? 'Creating…' : 'Create project'}</button></div>
    </form>
  </div>;
}
