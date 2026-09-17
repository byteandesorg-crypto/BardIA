import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPace, formatDuration, formatDate } from '@/lib/utils';
import {
  Users,
  Activity,
  Mountain,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Clock,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Consultar alumnos
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  // Consultar entrenamientos recientes con datos del alumno
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, student:students(first_name, last_name, discipline)')
    .order('workout_date', { ascending: false })
    .limit(8);

  // Calcular métricas agregadas
  const totalStudents = students?.length || 0;
  const totalWorkouts = workouts?.length || 0;
  const totalKm = workouts?.reduce((acc, w) => acc + (Number(w.distance_km) || 0), 0) || 0;
  const totalElevation = workouts?.reduce((acc, w) => acc + (Number(w.elevation_gain_m) || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Dashboard Operativo</h1>
          <p className="text-xs text-bardia-rock/60 mt-0.5">
            Resumen de actividad de tus alumnos, volumen y registros recientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/students/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="w-4 h-4 text-bardia-cyan" />
              <span>Nuevo Alumno</span>
            </Button>
          </Link>
          <Link href="/workouts/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Cargar Entrenamiento</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Alumnos Activos"
          value={totalStudents}
          unit="deportistas"
          icon={Users}
          subtitle="En seguimiento continuo"
        />
        <StatCard
          title="Sesiones Registradas"
          value={totalWorkouts}
          unit="entrenamientos"
          icon={Activity}
          subtitle="En el histórico activo"
        />
        <StatCard
          title="Distancia Total"
          value={totalKm.toFixed(1)}
          unit="km"
          icon={TrendingUp}
          subtitle="Volumen consolidado"
        />
        <StatCard
          title="Desnivel Acumulado"
          value={totalElevation.toLocaleString('es-AR')}
          unit="+m"
          icon={Mountain}
          subtitle="Ascenso positivo"
        />
      </div>

      {/* Main Grid: Entrenamientos recientes & Alumnos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entrenamientos recientes (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Entrenamientos Recientes</CardTitle>
                <p className="text-xs text-bardia-rock/60 mt-0.5">
                  Últimas sesiones cargadas en la plataforma
                </p>
              </div>
              <Link href="/workouts" className="text-xs font-semibold text-bardia-blue hover:text-bardia-cyan flex items-center gap-1">
                Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {workouts && workouts.length > 0 ? (
                <div className="divide-y divide-bardia-stoneLight">
                  {workouts.map((w) => (
                    <div key={w.id} className="p-4 hover:bg-bardia-snow/60 transition-colors flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-bardia-blue truncate">
                            {w.student ? `${w.student.first_name} ${w.student.last_name}` : 'Alumno'}
                          </span>
                          <Badge variant="info" className="text-[10px] py-0 px-2">
                            {w.workout_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-bardia-rock/70 truncate">{w.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-bardia-rock/50">
                          <span>{formatDate(w.workout_date)}</span>
                          {w.duration_seconds ? <span>⏱ {formatDuration(w.duration_seconds)}</span> : null}
                          {w.average_pace_sec_km ? <span>⚡ {formatPace(w.average_pace_sec_km)}</span> : null}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {w.distance_km ? (
                          <div className="text-base font-bold text-bardia-blue">
                            {w.distance_km} <span className="text-xs font-normal text-bardia-rock/60">km</span>
                          </div>
                        ) : null}
                        {w.elevation_gain_m ? (
                          <div className="text-xs font-medium text-bardia-green">
                            +{w.elevation_gain_m}m
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="Aún no hay entrenamientos registrados"
                  description="Comenzá registrando la primera sesión de un alumno para visualizar métricas."
                  className="m-4 border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral: Accesos Directos & Alumnos */}
        <div className="space-y-6">
          {/* Accesos Rápidos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Flujo de Trabajo Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link href="/workouts/new" className="block">
                <div className="p-3 rounded-md bg-bardia-snow hover:bg-bardia-stoneLight/80 transition-colors border border-bardia-border flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-bardia-blue text-bardia-cyan">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-bardia-blue group-hover:text-bardia-cyan transition-colors">
                        Registrar Entrenamiento
                      </div>
                      <div className="text-[11px] text-bardia-rock/60">Carga rápida de sesión</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-bardia-rock/40 group-hover:text-bardia-blue" />
                </div>
              </Link>

              <Link href="/reports/new" className="block">
                <div className="p-3 rounded-md bg-bardia-snow hover:bg-bardia-stoneLight/80 transition-colors border border-bardia-border flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-bardia-green text-white">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-bardia-blue group-hover:text-bardia-green transition-colors">
                        Nuevo Informe A4
                      </div>
                      <div className="text-[11px] text-bardia-rock/60">Exportable en PDF para el alumno</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-bardia-rock/40 group-hover:text-bardia-blue" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Resumen de Alumnos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Alumnos Recientes</CardTitle>
              <Link href="/students" className="text-xs font-semibold text-bardia-blue hover:text-bardia-cyan">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {students && students.length > 0 ? (
                <div className="divide-y divide-bardia-stoneLight">
                  {students.slice(0, 5).map((s) => (
                    <Link
                      key={s.id}
                      href={`/students/${s.id}`}
                      className="p-3.5 hover:bg-bardia-snow/60 transition-colors flex items-center justify-between block"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-bardia-blue truncate">
                          {s.first_name} {s.last_name}
                        </div>
                        <div className="text-[11px] text-bardia-rock/60 truncate">
                          {s.discipline} • {s.level}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-bardia-rock/40 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Sin alumnos dados de alta"
                  description="Creá el perfil de tu primer alumno."
                  className="m-4 border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
