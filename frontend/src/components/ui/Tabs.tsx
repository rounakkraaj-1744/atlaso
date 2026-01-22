import type { ReactNode } from 'react';
import { useState } from 'react';
import {cn} from "../../lib/utils"

interface Tab {
    id: string;
    label: string;
    content: ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'px-4 py-3 text-sm font-medium transition-colors relative',
                            activeTab === tab.id
                                ? 'text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        )}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
                        )}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-auto p-4">{activeContent}</div>
        </div>
    );
}
