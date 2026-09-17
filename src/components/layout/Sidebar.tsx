'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  Settings,
  Mountain,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Alumnos', href: '/students', icon: Users },
  { name: 'Entrenamientos', href: '/workouts', icon: Activity },
  { name: 'Informes', href: '/reports', icon: FileText },
  { name: 'Configuración', href: '/settings/organization', icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-64 flex flex-col border-r border-bardia-border bg-white min-h-screen select-none',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-bardia-border/70">
        <Logo />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-bardia-rock/40 uppercase tracking-wider">
          Plataforma
        </div>

        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-bardia-blue text-white shadow-sm'
                  : 'text-bardia-rock/70 hover:bg-bardia-snow hover:text-bardia-blue'
              )}
            >
              <Icon
                className={cn('w-4 h-4 transition-colors', isActive ? 'text-bardia-cyan' : 'text-bardia-rock/50')}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Altitude/Performance Widget (Neuquén Barda vibe) */}
      <div className="p-4 m-3 rounded-md bg-bardia-snow border border-bardia-stone/80 text-xs">
        <div className="flex items-center gap-2 text-bardia-blue font-semibold mb-1">
          <Mountain className="w-3.5 h-3.5 text-bardia-cyan" />
          <span>BARDIA System</span>
        </div>
        <p className="text-[11px] text-bardia-rock/60 leading-relaxed">
          Diseñado para tracking de altimetría, volumen y evolución deportiva.
        </p>
      </div>
    </aside>
  );
}
