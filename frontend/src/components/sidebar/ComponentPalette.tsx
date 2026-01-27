import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { componentRegistry, vendorNames, domainNames, dataPatternNames } from '../../features/registry/data/components';
import type { ComponentPack, Domain, Vendor, DataPattern, ComponentRegistryItem } from '../../types/registry';
import { ComponentIconRenderer } from '../canvas/ComponentIconRenderer';

interface ComponentRegistryPanelProps {
  enabledPacks: Set<ComponentPack>;
  onTogglePack: (pack: ComponentPack) => void;
}

export function ComponentRegistryPanel({ enabledPacks, onTogglePack }: ComponentRegistryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendors, setSelectedVendors] = useState<Set<Vendor>>(new Set());
  const [selectedDomains, setSelectedDomains] = useState<Set<Domain>>(new Set());
  const [selectedPatterns, setSelectedPatterns] = useState<Set<DataPattern>>(new Set());
  const [expandedDomains, setExpandedDomains] = useState<Set<Domain>>(new Set(['compute', 'storage', 'messaging', 'networking']));
  const [showFilters, setShowFilters] = useState(false);

  // Filter components based on search and filters
  const filteredComponents = useMemo(() => {
    const components = Object.values(componentRegistry) as ComponentRegistryItem[];

    return components.filter((comp) => {
      if (!enabledPacks.has(comp.pack)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          comp.name.toLowerCase().includes(query) ||
          comp.description.toLowerCase().includes(query) ||
          comp.tags.some((tag) => tag.includes(query)) ||
          comp.vendor.includes(query);
        if (!matchesSearch)
          return false;
      }

      if (selectedVendors.size > 0 && !selectedVendors.has(comp.vendor))
        return false;

      if (selectedDomains.size > 0 && !selectedDomains.has(comp.domain))
        return false;

      if (selectedPatterns.size > 0) {
        const hasPattern = comp.dataPatterns.some((p) => selectedPatterns.has(p));
        if (!hasPattern)
          return false;
      }

      return true;
    });
  }, [searchQuery, selectedVendors, selectedDomains, selectedPatterns, enabledPacks]);

  const componentsByDomain = useMemo(() => {
    const grouped: Record<Domain, ComponentRegistryItem[]> = {} as any;
    filteredComponents.forEach((comp) => {
      if (!grouped[comp.domain])
        grouped[comp.domain] = [];
      grouped[comp.domain].push(comp);
    });
    return grouped;
  }, [filteredComponents]);

  const toggleDomain = (domain: Domain) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const toggleVendor = (vendor: Vendor) => {
    const newVendors = new Set(selectedVendors);
    if (newVendors.has(vendor))
      newVendors.delete(vendor);
    else
      newVendors.add(vendor);
    setSelectedVendors(newVendors);
  };

  const toggleDomainFilter = (domain: Domain) => {
    const newDomains = new Set(selectedDomains);
    if (newDomains.has(domain))
      newDomains.delete(domain);
    else
      newDomains.add(domain);
    setSelectedDomains(newDomains);
  };

  const togglePattern = (pattern: DataPattern) => {
    const newPatterns = new Set(selectedPatterns);
    if (newPatterns.has(pattern))
      newPatterns.delete(pattern);
    else
      newPatterns.add(pattern);
    setSelectedPatterns(newPatterns);
  };

  const clearFilters = () => {
    setSelectedVendors(new Set());
    setSelectedDomains(new Set());
    setSelectedPatterns(new Set());
    setSearchQuery('');
  };

  const activeFilterCount = selectedVendors.size + selectedDomains.size + selectedPatterns.size;

  return (
    <div className="h-full bg-transparent border-r border-white/5 flex flex-col">
      <div className="p-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Component Registry
        </h2>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-black/20 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-2 py-1.5 bg-black/10 border border-white/5 rounded-lg text-xs text-slate-300 hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded font-mono">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-2 bg-black/20 border border-white/5 rounded-lg space-y-2"
          >
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Vendor</div>
              <div className="flex flex-wrap gap-1">
                {(['aws', 'gcp', 'azure', 'oss'] as Vendor[]).map((vendor) => (
                  <button
                    key={vendor}
                    onClick={() => toggleVendor(vendor)}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${selectedVendors.has(vendor)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                  >
                    {vendorNames[vendor]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Domain</div>
              <div className="flex flex-wrap gap-1">
                {(['compute', 'storage', 'messaging', 'networking'] as Domain[]).map((domain) => (
                  <button
                    key={domain}
                    onClick={() => toggleDomainFilter(domain)}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${selectedDomains.has(domain)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                  >
                    {domainNames[domain]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Pattern</div>
              <div className="flex flex-wrap gap-1">
                {(['sync', 'async', 'stream'] as DataPattern[]).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => togglePattern(pattern)}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${selectedPatterns.has(pattern)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                  >
                    {dataPatternNames[pattern]}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="w-full text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="px-3 py-2 border-b border-white/5">
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-2">
          <Package className="w-3 h-3" />
          Component Packs
        </div>
        <div className="space-y-0.5">
          {(['aws', 'gcp', 'azure', 'oss'] as ComponentPack[]).map((pack) => (
            <label key={pack} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={enabledPacks.has(pack)}
                onChange={() => onTogglePack(pack)}
                className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                {pack === 'aws' && 'AWS'}
                {pack === 'gcp' && 'Google Cloud'}
                {pack === 'azure' && 'Microsoft Azure'}
                {pack === 'oss' && 'Open Source'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {Object.keys(componentsByDomain).length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-xs">
            No components found
          </div>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(componentsByDomain).map(([domain, components]) => (
              <div key={domain}>
                <button
                  onClick={() => toggleDomain(domain as Domain)}
                  className="w-full flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {expandedDomains.has(domain as Domain) ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <span>{domainNames[domain]}</span>
                  <span className="text-[10px] text-slate-600">({components.length})</span>
                </button>

                <AnimatePresence>
                  {expandedDomains.has(domain as Domain) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 pl-1 mt-0.5 overflow-hidden"
                    >
                      {components.map((comp) => (
                        <DraggableRegistryComponent key={comp.type} component={comp} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/5">
        <div className="text-[10px] text-slate-600">
          {filteredComponents.length} components loaded
        </div>
      </div>
    </div>
  );
}

function DraggableRegistryComponent({ component }: { component: ComponentRegistryItem }) {
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
      className={`group flex items-start gap-2.5 p-2.5 rounded-lg border border-white/5 bg-white/5 cursor-grab hover:bg-white/10 hover:border-white/20 transition-all select-none ${isDragging ? 'opacity-50' : ''
        }`}
      title={component.description}
    >
      <div className="mt-0.5">
        <ComponentIconRenderer type={component.type} vendor={component.vendor} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="text-sm text-slate-200 font-medium truncate">{component.name}</div>
          {component.isManaged && (
            <span className="px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] rounded uppercase tracking-wide">
              Managed
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 line-clamp-2">{component.description}</div>
        <div className="flex items-center gap-1 mt-1">
          {component.dataPatterns.slice(0, 2).map((pattern: string) => (
            <span
              key={pattern}
              className="px-1.5 py-0.5 bg-black/20 text-slate-400 text-[10px] rounded border border-white/5"
            >
              {pattern}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}