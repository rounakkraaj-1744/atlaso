import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
}

export function Drawer({ isOpen, onClose, title, children, className }: DrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed right-0 top-0 bottom-0 w-96 bg-bg-secondary border-l border-border z-50',
                    'flex flex-col shadow-2xl',
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {children}
                </div>
            </div>
        </>
    );
}
