'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  userEmail?: string;
  organizationName?: string;
}

export function Navbar({ userEmail = 'Entrenador', organizationName = 'Mi Estudio' }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-bardia-border bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Organization badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bardia-snow border border-bardia-border text-xs font-semibold text-bardia-blue">
          <Building2 className="w-3.5 h-3.5 text-bardia-cyan" />
          <span>{organizationName}</span>
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-bardia-rock/70">
          <div className="w-7 h-7 rounded-full bg-bardia-stoneLight flex items-center justify-center text-bardia-blue">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-bardia-rock">{userEmail}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-bardia-rock/60 hover:text-red-600 hover:bg-red-50"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}
