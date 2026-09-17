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

  // 1. Consultar membresía de organización
  let { data: memberships } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .order('id', { ascending: true })
    .limit(1);

  let membership = memberships?.[0];

  // Si no tiene organización, inicializarla de inmediato
  if (!membership || !membership.organization) {
    const defaultName = 'BARDIA Trail Running Team';
    const slug = 'bardia-team-' + user.id.slice(0, 6);

    try {
      const { data: newOrgId } = await supabase.rpc('create_organization_and_owner', {
        p_name: defaultName,
        p_slug: slug,
      });

      if (newOrgId) {
        const { data: refreshed } = await supabase
          .from('organization_members')
          .select('*, organization:organizations(*)')
          .eq('user_id', user.id)
          .limit(1);
        membership = refreshed?.[0];
      }
    } catch (err) {
      console.error('Error auto-creating organization:', err);
    }
  }

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
