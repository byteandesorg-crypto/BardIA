import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-bardia-stoneLight text-bardia-rock border-bardia-stone',
    success: 'bg-emerald-50 text-bardia-green border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-bardia-blue border-sky-200',
    outline: 'border-bardia-border text-bardia-rock/80 bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
