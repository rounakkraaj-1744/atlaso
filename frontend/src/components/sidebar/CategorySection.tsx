import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ComponentDefinition } from '../../types';
import { cn } from '../../lib/utils';

interface CategorySectionProps {
    title: string;
    components: ComponentDefinition[];
    defaultExpanded?: boolean;
}

export function CategorySection({ title, components, defaultExpanded = true }: CategorySectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="border-b border-border last:border-b-0">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-tertiary/50 transition-colors"
            >
                <span className="text-sm font-semibold text-text-primary">{title}</span>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                )}
            </button>

            {isExpanded && (
                <div className="px-2 pb-2 space-y-1">
                    {components.map((component) => (
                        <DraggableComponent key={component.id} component={component} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface DraggableComponentProps {
    component: ComponentDefinition;
}

function DraggableComponent({ component }: DraggableComponentProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/reactflow', JSON.stringify({
            type: component.id,
            name: component.name,
        }));
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-grab',
                'bg-bg-tertiary hover:bg-bg-tertiary/80 border border-border',
                'transition-all duration-150',
                isDragging && 'opacity-50 cursor-grabbing'
            )}
            title={component.description}
        >
            <div className="flex-shrink-0 w-8 h-8 rounded bg-bg-primary flex items-center justify-center">
                <ComponentIcon icon={component.icon} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                    {component.name}
                </p>
                <p className="text-xs text-text-secondary truncate">
                    {component.description}
                </p>
            </div>
        </div>
    );
}

interface ComponentIconProps {
    icon: string;
}

function ComponentIcon({ icon }: ComponentIconProps) {
    // Dynamically import Lucide icons
    const icons: Record<string, any> = {
        Scale: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
        Network: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
        Globe: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        Server: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
        Cpu: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
        Clock: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        Workflow: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
        MessageSquare: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
        ListTodo: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
        Database: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
        BarChart3: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        FileText: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        GitBranch: () => <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>,
    };

    const IconComponent = icons[icon];
    return IconComponent ? <IconComponent /> : null;
}
