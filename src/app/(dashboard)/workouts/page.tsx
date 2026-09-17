import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPace, formatDuration, formatDate } from '@/lib/utils';
import { Plus, Activity, Mountain, Calendar, User } from 'lucide-react';

export default async function WorkoutsPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, student:students(id, first_name, last_name, discipline)')
    .order('workout_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Entrenamientos</h1>
          <p className="text-xs text-bardia-rock/60 mt-0.5">
            Registro global de sesiones deportivas, desniveles y métricas de rendimiento.
          </p>
        </div>

        <Link href="/workouts/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Cargar Entrenamiento</span>
          </Button>
        </Link>
      </div>

      {workouts && workouts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bardia-snow border-b border-bardia-stoneLight text-bardia-rock/60 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Alumno</th>
                    <th className="p-4">Sesión / Tipo</th>
                    <th className="p-4">Distancia</th>
                    <th className="p-4">Duración</th>
                    <th className="p-4">Ritmo</th>
                    <th className="p-4">Desnivel</th>
                    <th className="p-4">FC Media</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bardia-stoneLight">
                  {workouts.map((w) => (
                    <tr key={w.id} className="hover:bg-bardia-snow/60 transition-colors">
                      <td className="p-4 font-semibold text-bardia-blue whitespace-nowrap">
                        {formatDate(w.workout_date)}
                      </td>
                      <td className="p-4">
                        {w.student ? (
                          <Link
                            href={`/students/${w.student.id}`}
                            className="font-bold text-bardia-blue hover:text-bardia-cyan"
                          >
                            {w.student.first_name} {w.student.last_name}
                          </Link>
                        ) : (
                          <span className="text-bardia-rock/50">Alumno</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-bardia-rock">{w.title}</div>
                        <Badge variant="default" className="text-[9px] mt-0.5">
                          {w.workout_type}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold text-bardia-blue">
                        {w.distance_km ? `${w.distance_km} km` : '-'}
                      </td>
                      <td className="p-4 text-bardia-rock/70">
                        {formatDuration(w.duration_seconds)}
                      </td>
                      <td className="p-4 font-medium text-bardia-rock">
                        {formatPace(w.average_pace_sec_km)}
                      </td>
                      <td className="p-4 font-semibold text-bardia-green">
                        {w.elevation_gain_m ? `+${w.elevation_gain_m}m` : '-'}
                      </td>
                      <td className="p-4 text-bardia-rock/70">
                        {w.average_hr ? `${w.average_hr} bpm` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Activity}
          title="No hay entrenamientos cargados"
          description="Comenzá a registrar los entrenamientos de tus alumnos para medir su progreso."
          actionLabel="Cargar Primer Entrenamiento"
        />
      )}
    </div>
  );
}
