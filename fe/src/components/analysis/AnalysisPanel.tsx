import { Panel } from '../ui/Panel';
import { Tabs } from '../ui/Tabs';
import { ConstraintsTab } from './ConstraintsTab';
import { ResultsTab } from './ResultsTab';
import { SuggestionsTab } from './SuggestionsTab';

export function AnalysisPanel() {
    const tabs = [
        {
            id: 'constraints',
            label: 'Constraints',
            content: <ConstraintsTab />,
        },
        {
            id: 'analysis',
            label: 'Analysis',
            content: <ResultsTab />,
        },
        {
            id: 'suggestions',
            label: 'Suggestions',
            content: <SuggestionsTab />,
        },
    ];

    return (
        <Panel className="w-96 h-full">
            <Tabs tabs={tabs} defaultTab="constraints" />
        </Panel>
    );
}
