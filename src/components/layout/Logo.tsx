import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className={cn('flex items-center gap-2.5 group select-none', className)}>
      <div className="w-8 h-8 rounded-md bg-bardia-blue flex items-center justify-center text-bardia-cyan shadow-sm group-hover:bg-bardia-blue/90 transition-colors">
        {/* Isotipo: Perfil de barda/altimetría deportiva */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <polyline points="2 18 7 11 11 15 16 8 22 18" />
          <line x1="2" y1="18" x2="22" y2="18" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-bold tracking-wider text-base text-bardia-blue leading-none">
            BARDIA
          </span>
          <span className="text-[10px] font-semibold text-bardia-rock/50 tracking-widest uppercase">
            Performance
          </span>
        </div>
      )}
    </Link>
  );
}
