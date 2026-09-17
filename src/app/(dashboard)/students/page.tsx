import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Users, Search, ChevronRight, Phone, HeartPulse } from 'lucide-react';

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('last_name', { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Alumnos</h1>
          <p className="text-xs text-bardia-rock/60 mt-0.5">
            Gestión de deportistas, perfiles deportivos, documentación y fichas de emergencia.
          </p>
        </div>

        <Link href="/students/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Nuevo Alumno</span>
          </Button>
        </Link>
      </div>

      {/* Lista de Alumnos */}
      {students && students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`} className="block group">
              <Card className="h-full transition-all group-hover:border-bardia-cyan group-hover:shadow-md">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-base font-bold text-bardia-blue group-hover:text-bardia-blue/90">
                          {student.last_name}, {student.first_name}
                        </h2>
                        <div className="text-xs text-bardia-rock/60 mt-0.5">
                          {student.email || 'Sin correo cargado'}
                        </div>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        {student.discipline}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-bardia-rock/70 border-t border-bardia-stoneLight/80 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-bardia-rock/50">Nivel:</span>
                        <span className="font-semibold text-bardia-rock">{student.level || 'No especificado'}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-bardia-rock/50">Teléfono:</span>
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.emergency_contact_name && (
                        <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded text-[11px] font-medium">
                          <span className="flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 text-emerald-600" />
                            Emergencia:
                          </span>
                          <span>{student.emergency_contact_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-bardia-stoneLight/60 flex items-center justify-between text-xs font-semibold text-bardia-blue">
                    <span>Ver ficha técnica y métricas</span>
                    <ChevronRight className="w-4 h-4 text-bardia-rock/40 group-hover:text-bardia-cyan group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No hay alumnos registrados"
          description="Agregá tu primer alumno para comenzar a registrar sus sesiones deportivas y documentación médica."
          actionLabel="Registrar Alumno"
        />
      )}
    </div>
  );
}
