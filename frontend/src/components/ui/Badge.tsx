import { cn } from '../../lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'pass' | 'risky' | 'fail' | 'neutral';
    className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                {
                    'bg-accent-green/20 text-accent-green': variant === 'pass',
                    'bg-accent-yellow/20 text-accent-yellow': variant === 'risky',
                    'bg-accent-red/20 text-accent-red': variant === 'fail',
                    'bg-bg-tertiary text-text-secondary': variant === 'neutral',
                },
                className
            )}
        >
            {children}
        </span>
    );
}
