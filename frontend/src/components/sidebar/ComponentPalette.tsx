import { useState, useMemo } from 'react';
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
    <div className="h-full bg-slate-900 border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
          Component Registry
        </h2>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-3 p-3 bg-slate-800 border border-slate-700 rounded-lg space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Vendor</div>
              <div className="flex flex-wrap gap-1">
                {(['aws', 'gcp', 'azure', 'oss'] as Vendor[]).map((vendor) => (
                  <button
                    key={vendor}
                    onClick={() => toggleVendor(vendor)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${selectedVendors.has(vendor)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                  >
                    {vendorNames[vendor]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Domain</div>
              <div className="flex flex-wrap gap-1">
                {(['compute', 'storage', 'messaging', 'networking'] as Domain[]).map((domain) => (
                  <button
                    key={domain}
                    onClick={() => toggleDomainFilter(domain)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${selectedDomains.has(domain)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                  >
                    {domainNames[domain]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Pattern</div>
              <div className="flex flex-wrap gap-1">
                {(['sync', 'async', 'stream'] as DataPattern[]).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => togglePattern(pattern)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${selectedPatterns.has(pattern)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Component Packs
        </div>
        <div className="space-y-1">
          {(['aws', 'gcp', 'azure', 'oss'] as ComponentPack[]).map((pack) => (
            <label key={pack} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={enabledPacks.has(pack)}
                onChange={() => onTogglePack(pack)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                {pack === 'aws' && 'AWS'}
                {pack === 'gcp' && 'Google Cloud'}
                {pack === 'azure' && 'Microsoft Azure'}
                {pack === 'oss' && 'Open Source'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {Object.keys(componentsByDomain).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No components found
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(componentsByDomain).map(([domain, components]) => (
              <div key={domain}>
                <button
                  onClick={() => toggleDomain(domain as Domain)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {expandedDomains.has(domain as Domain) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>{domainNames[domain]}</span>
                  <span className="text-xs text-slate-600">({components.length})</span>
                </button>

                {expandedDomains.has(domain as Domain) && (
                  <div className="space-y-1.5 pl-2 mt-1">
                    {components.map((comp) => (
                      <DraggableRegistryComponent key={comp.type} component={comp} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="text-xs text-slate-500">
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
      className={`group flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-700/50 bg-slate-800/30 cursor-grab hover:bg-slate-700/40 hover:border-slate-600 transition-all select-none ${isDragging ? 'opacity-50' : ''
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
            <span className="px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded uppercase tracking-wide">
              Managed
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 line-clamp-2">{component.description}</div>
        <div className="flex items-center gap-1 mt-1">
          {component.dataPatterns.slice(0, 2).map((pattern: string) => (
            <span
              key={pattern}
              className="px-1.5 py-0.5 bg-slate-700/50 text-slate-400 text-[10px] rounded"
            >
              {pattern}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}