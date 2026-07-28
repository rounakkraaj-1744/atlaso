import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Layers3, Search, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ProviderOption = 'AWS' | 'Azure' | 'Google Cloud' | 'Cloudflare' | 'Civo';
export type ApplyMode = 'replace-all' | 'keep-manual' | 'preview';

interface ProviderMappingDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const providers: ProviderOption[] = ['AWS', 'Azure', 'Google Cloud', 'Cloudflare', 'Civo'];

const modeOptions: Array<{
  id: ApplyMode;
  title: string;
  description: string;
  recommended?: boolean;
}> = [
  {
    id: 'replace-all',
    title: 'Replace all technologies',
    description: 'Replace every mapped component with the selected provider equivalents.',
  },
  {
    id: 'keep-manual',
    title: 'Keep manually selected technologies',
    description: 'Preserve technologies that were manually overridden.',
    recommended: true,
  },
  {
    id: 'preview',
    title: 'Preview changes before applying',
    description: 'Review all component changes before applying.',
  },
];

export function ProviderMappingDropdown({ isOpen, onClose }: ProviderMappingDropdownProps) {
  const [provider, setProvider] = useState<ProviderOption>('AWS');
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [applyMode, setApplyMode] = useState<ApplyMode>('keep-manual');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') 
        onClose();
      if (e.key === 'Enter') 
        onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const content = useMemo(() => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 5 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="absolute right-0 top-[calc(100%+8px)] z-50 w-105 origin-top-right rounded-2xl border border-white/10 bg-[#0b0f16]/95 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-slate-200">
              <Layers3 className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-semibold tracking-tight">Apply Provider Mapping</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Choose how you want to apply the selected provider mapping to your current architecture.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Provider</label>
            <button 
              onClick={() => setIsProviderOpen(!isProviderOpen)}
              className="flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
            >
              <span>{provider}</span>
              <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", isProviderOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isProviderOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-white/10 bg-[#0b0f16]/95 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {providers.map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setProvider(item);
                          setIsProviderOpen(false);
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          provider === item ? 'border-blue-500/40 bg-blue-500/10 text-white' : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/5 text-slate-300'
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Apply Mode</label>
            <div className="space-y-2">
              {modeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setApplyMode(option.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                    applyMode === option.id ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/5'
                  )}
                >
                  <div className={cn('mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors', applyMode === option.id ? 'border-blue-500 bg-transparent' : 'border-slate-600 bg-transparent')}>
                    {applyMode === option.id && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">{option.title}</span>
                      {option.recommended && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Recommended</span>}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
            Cancel
          </button>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
            <Sparkles className="h-4 w-4" />
            Apply Mapping
          </button>
        </div>
      </motion.div>
    );
  }, [applyMode, onClose, provider]);

  return (
    <AnimatePresence>
      {isOpen && content}
    </AnimatePresence>
  );
}

interface ReplaceTechnologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  primitiveName?: string;
}

const techRows = [
  ['Generic', 'Default implementation for this primitive.'],
  ['AWS Cognito', 'Managed user pools and identity federation.'],
  ['Supabase Auth', 'Postgres-backed auth with social login support.'],
  ['Clerk', 'Developer-first authentication and user management.'],
  ['BetterAuth', 'Framework-agnostic auth toolkit.'],
  ['NextAuth', 'Authentication for Next.js applications.'],
  ['Firebase Auth', 'Google-managed identity primitives.'],
  ['Auth0', 'Enterprise identity platform with SSO support.'],
  ['Keycloak', 'Self-hosted identity and access management.'],
  ['Custom...', 'User-defined implementation placeholder.'],
];

export function ReplaceTechnologyModal({ isOpen, onClose, primitiveName = 'Authentication' }: ReplaceTechnologyModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(2);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') 
        onClose();
      if (e.key === 'Enter') 
        onClose();
      if (e.key === 'ArrowDown') 
        setActiveIndex((i) => Math.min(i + 1, techRows.length - 1));
      if (e.key === 'ArrowUp') 
        setActiveIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = techRows.filter(([name, description]) => `${name} ${description}`.toLowerCase().includes(query.toLowerCase()));

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-130 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f16]/95 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-100">Replace Technology</h2>
              <p className="mt-1 text-sm text-slate-400">Select a technology implementation for this engineering primitive.</p>
            </div>
            <button onClick={onClose} className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-blue-500/40">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search technologies..."
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto px-3 pb-4">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{primitiveName} example</div>
            <div className="space-y-1">
              {filtered.map(([name, description], index) => (
                <button
                  key={name}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white/5',
                    activeIndex === index ? 'border-blue-500/40 bg-blue-500/10' : 'border-transparent'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-xs font-semibold text-slate-300">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">{name}</span>
                      {name === 'Supabase Auth' && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Popular</span>}
                    </div>
                    <div className="truncate text-sm text-slate-400">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-4">
            <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
              Cancel
            </button>
            <button onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
              Replace Technology
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
