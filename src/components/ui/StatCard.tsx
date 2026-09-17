import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-bardia-border bg-white p-5 shadow-sm transition-all hover:border-bardia-cyan/50',
        className
      )}
    >
      <div className="flex items-center justify-between text-bardia-rock/60 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded-md bg-bardia-stoneLight text-bardia-blue">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-bardia-blue">{value}</span>
        {unit && <span className="text-xs font-medium text-bardia-rock/60">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-bardia-stoneLight/60 text-xs">
        {subtitle && <span className="text-bardia-rock/60">{subtitle}</span>}
        {trend && (
          <span
            className={cn(
              'font-semibold text-xs',
              trend.isPositive ? 'text-emerald-700' : 'text-red-600'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
