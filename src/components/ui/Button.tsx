import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bardia-cyan focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

    const variants = {
      primary: 'bg-bardia-blue text-white hover:bg-bardia-blue/90 shadow-sm active:scale-[0.99]',
      secondary: 'bg-bardia-green text-white hover:bg-bardia-green/90 shadow-sm active:scale-[0.99]',
      outline: 'border border-bardia-border bg-white text-bardia-rock hover:bg-bardia-snow hover:border-bardia-stone active:scale-[0.99]',
      ghost: 'text-bardia-rock hover:bg-bardia-stone/40 active:scale-[0.99]',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.99]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
