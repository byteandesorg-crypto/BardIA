'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Organization, OrganizationMember } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Building2, Users, Shield, CheckCircle2 } from 'lucide-react';

interface OrganizationSettingsClientProps {
  organization: Organization;
  members: OrganizationMember[];
  isOwner: boolean;
}

export function OrganizationSettingsClient({
  organization,
  members,
  isOwner,
}: OrganizationSettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(organization.name);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      setSuccess('Organización actualizada correctamente.');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al actualizar la organización.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Configuración de Organización</h1>
        <p className="text-xs text-bardia-rock/60 mt-0.5">
          Administrá el nombre de tu equipo o estudio deportivo y revisá los miembros con acceso.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Datos Básicos de Organización */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-bardia-blue" />
            <CardTitle>Datos del Equipo</CardTitle>
          </div>
          <CardDescription>
            Este nombre se mostrará en los informes técnicos emitidos para los alumnos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de la Organización"
                value={name}
                disabled={!isOwner}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Identificador Único (Slug)"
                value={organization.slug}
                disabled
                helperText="Generado automáticamente para aislamiento multi-tenant."
              />
            </div>

            {isOwner && (
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isLoading} size="sm">
                  Guardar Cambios
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Miembros del Equipo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-bardia-cyan" />
            <CardTitle>Equipo de Entrenadores ({members.length})</CardTitle>
          </div>
          <CardDescription>
            Profesionales que tienen permisos para consultar y registrar actividades en esta organización.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-bardia-stoneLight">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between text-xs hover:bg-bardia-snow/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bardia-blue text-bardia-cyan flex items-center justify-center font-bold">
                    {member.profile?.first_name?.[0] || 'E'}
                  </div>
                  <div>
                    <div className="font-bold text-bardia-blue">
                      {member.profile?.first_name} {member.profile?.last_name || ''}
                    </div>
                    <div className="text-[11px] text-bardia-rock/50">{member.profile?.email}</div>
                  </div>
                </div>

                <Badge variant={member.role === 'owner' ? 'info' : 'default'} className="uppercase text-[10px]">
                  {member.role === 'owner' ? 'Propietario (Owner)' : 'Entrenador (Trainer)'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
