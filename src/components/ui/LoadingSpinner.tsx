import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-4', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-bardia-stone border-t-bardia-blue',
          sizeClasses[size]
        )}
      />
      {label && <p className="text-sm font-medium text-bardia-rock/70">{label}</p>}
    </div>
  );
}
