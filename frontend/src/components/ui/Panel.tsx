import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
    ({ className, title, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('panel flex flex-col', className)}
                {...props}
            >
                {title && (
                    <div className="border-b border-border px-4 py-3">
                        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                    </div>
                )}
                <div className="flex-1 overflow-auto">{children}</div>
            </div>
        );
    }
);

Panel.displayName = 'Panel';
