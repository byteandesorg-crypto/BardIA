import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene de forma segura el organization_id del usuario actual.
 * Si por alguna razón el usuario aún no tuviera una organización vinculada,
 * la crea automáticamente para evitar bloqueos operativos o errores 406.
 */
export async function getOrInitUserOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<{ organizationId: number; role: string }> {
  // 1. Intentar consultar membresía existente
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .order('id', { ascending: true })
    .limit(1);

  if (!error && members && members.length > 0) {
    return {
      organizationId: members[0].organization_id,
      role: members[0].role,
    };
  }

  // 2. Si no tiene organización, crear una atómica vía RPC
  const defaultOrgName = 'Mi Estudio de Entrenamiento';
  const slug = 'estudio-' + userId.slice(0, 8);

  try {
    const { data: newOrgId, error: rpcError } = await supabase.rpc(
      'create_organization_and_owner',
      {
        p_name: defaultOrgName,
        p_slug: slug,
      }
    );

    if (!rpcError && newOrgId) {
      return { organizationId: newOrgId, role: 'owner' };
    }
  } catch (err) {
    console.error('Error al inicializar organización:', err);
  }

  // Fallback: re-consultar
  const { data: fallbackMembers } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .limit(1);

  if (fallbackMembers && fallbackMembers.length > 0) {
    return {
      organizationId: fallbackMembers[0].organization_id,
      role: fallbackMembers[0].role,
    };
  }

  throw new Error('No se pudo determinar ni inicializar la organización.');
}
