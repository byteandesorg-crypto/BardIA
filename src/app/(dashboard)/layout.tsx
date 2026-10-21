import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrInitUserOrganization } from '@/lib/supabase/get-org';
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

  // Obtener membresía u organización del usuario de manera segura
  const { organizationId } = await getOrInitUserOrganization(supabase, user.id);

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  const organizationName = org?.name || 'BARDIA Performance';

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
