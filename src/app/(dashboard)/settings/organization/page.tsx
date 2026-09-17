import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrganizationSettingsClient } from './OrganizationSettingsClient';

export default async function OrganizationSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Consultar membresía activa
  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .order('id', { ascending: true })
    .limit(1)
    .single();

  if (!membership || !membership.organization) {
    redirect('/dashboard');
  }

  // Consultar todos los miembros de la misma organización
  const { data: members } = await supabase
    .from('organization_members')
    .select('*, profile:profiles(*)')
    .eq('organization_id', membership.organization_id)
    .order('role', { ascending: true });

  const isOwner = membership.role === 'owner';

  return (
    <OrganizationSettingsClient
      organization={membership.organization}
      members={members || []}
      isOwner={isOwner}
    />
  );
}
