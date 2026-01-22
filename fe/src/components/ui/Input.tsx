import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, unit, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label className="text-sm font-medium text-text-primary">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={cn(
                            'w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border',
                            'text-text-primary placeholder:text-text-secondary',
                            'focus:outline-none focus:ring-2 focus:ring-accent-blue',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            unit && 'pr-12',
                            className
                        )}
                        {...props}
                    />
                    {unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-mono">
                            {unit}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

Input.displayName = 'Input';
