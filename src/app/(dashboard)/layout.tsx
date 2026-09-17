import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener membresía de organización del usuario de manera segura
  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  let organizationName = membership?.organization?.name;

  // Si el usuario no tiene ninguna organización creada aún, crear una por defecto
  if (!membership) {
    const defaultName = 'Estudio de Entrenamiento';
    const slug = 'org-' + user.id.slice(0, 8);
    try {
      await supabase.rpc('create_organization_and_owner', {
        p_name: defaultName,
        p_slug: slug,
      });
      organizationName = defaultName;
    } catch {
      organizationName = 'BARDIA Performance';
    }
  }

  return (
    <div className="flex min-h-screen bg-bardia-snow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar userEmail={user.email || ''} organizationName={organizationName || 'BARDIA'} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
