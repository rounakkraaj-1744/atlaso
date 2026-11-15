import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from "../../lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, unit, ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="text-xs font-medium text-slate-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={cn(
                            'w-full h-8 px-2 rounded-md bg-slate-900 border border-white/10',
                            'text-xs text-slate-100 placeholder:text-slate-500',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            unit && 'pr-8',
                            className
                        )}
                        {...props}
                    />
                    {unit && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                            {unit}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

Input.displayName = 'Input';
