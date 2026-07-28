import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { componentRegistry, domainNames } from '../../features/registry/data/components';
import type { Domain, ComponentRegistryItem } from '../../types/registry';
import { ComponentIconRenderer } from '../canvas/ComponentIconRenderer';

export function ComponentRegistryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  // By default, start with all categories collapsed except Compute and Networking
  const [expandedDomains, setExpandedDomains] = useState<Set<Domain>>(
    new Set(['compute', 'networking'])
  );

  const allComponents = useMemo(() => Object.values(componentRegistry) as ComponentRegistryItem[], []);

  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery) return allComponents;
    const query = searchQuery.toLowerCase();
    return allComponents.filter(
      (comp) =>
        comp.name.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query) ||
        comp.tags.some((tag) => tag.includes(query))
    );
  }, [searchQuery, allComponents]);

  // Group by domain
  const componentsByDomain = useMemo(() => {
    const grouped: Record<Domain, ComponentRegistryItem[]> = {} as any;
    filteredComponents.forEach((comp) => {
      if (!grouped[comp.domain]) grouped[comp.domain] = [];
      grouped[comp.domain].push(comp);
    });
    return grouped;
  }, [filteredComponents]);

  // Auto-expand categories if we are searching
  useEffect(() => {
    if (searchQuery) {
      setExpandedDomains(new Set(Object.keys(componentsByDomain) as Domain[]));
    }
  }, [searchQuery, componentsByDomain]);

  const toggleSection = (section: Domain) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(section)) newExpanded.delete(section);
    else newExpanded.add(section);
    setExpandedDomains(newExpanded);
  };

  const renderSection = (domain: Domain, title: string, components: ComponentRegistryItem[]) => {
    if (components.length === 0) return null;
    const isExpanded = expandedDomains.has(domain);

    return (
      <div key={domain} className="border-b border-white/5 last:border-b-0">
        <button
          onClick={() => toggleSection(domain)}
          className="w-full flex items-center gap-1.5 px-2 py-2 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.02] transition-colors"
        >
          <div className="text-slate-500">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
          <span className="flex-1 text-left uppercase tracking-wider">{title}</span>
          <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
            {components.length}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pb-2 px-1">
                {components.map((comp) => (
                  <DraggableCompactComponent key={comp.type} component={comp} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Define explicit order of domains for standard layout
  const domainOrder: Domain[] = [
    'compute', 'networking', 'storage', 'databases', 'cache',
    'messaging', 'security', 'observability', 'ai',
    'external', 'analytics', 'devops'
  ];

  return (
    <div className="h-full bg-[#09090b]/95 border-r border-white/5 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-white/[0.01]">
        <LayoutGrid className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-200">Primitives</span>
      </div>

      {/* Sticky Search */}
      <div className="p-3 border-b border-white/5 shrink-0 bg-[#09090b]/95 backdrop-blur-xl z-10 sticky top-0">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search primitives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Component Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {Object.keys(componentsByDomain).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No primitives found
          </div>
        ) : (
          <div className="py-1">
            {domainOrder.map((domain) => {
              const components = componentsByDomain[domain];
              if (!components) return null;
              return renderSection(domain, domainNames[domain] || domain, components);
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCompactComponent({ component }: { component: ComponentRegistryItem }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: { componentType: component.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`group flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md cursor-grab hover:bg-blue-500/10 hover:text-blue-100 transition-colors select-none ${
        isDragging ? 'opacity-40' : ''
      }`}
      title={component.description}
    >
      <div className="flex-shrink-0 opacity-70 group-hover:opacity-100 group-hover:text-blue-400 transition-all">
        <ComponentIconRenderer type={component.type} size={14} className="group-hover:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-xs text-slate-300 font-medium truncate group-hover:text-blue-100 transition-colors">
          {component.name}
        </div>
      </div>
    </div>
  );
}