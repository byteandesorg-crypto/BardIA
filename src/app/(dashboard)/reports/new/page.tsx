'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ArrowLeft, FileText, Calendar, CheckCircle2 } from 'lucide-react';

function ReportFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
  const [title, setTitle] = useState('Informe de Rendimiento Deportivo');
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [coachSummary, setCoachSummary] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });
      if (data) {
        setStudents(data);
        if (!preselectedStudentId && data.length > 0) {
          setSelectedStudentId(data[0].id.toString());
        }
      }
    }
    loadStudents();
  }, [supabase, preselectedStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Por favor seleccioná un alumno.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const studentIdNum = parseInt(selectedStudentId, 10);
      const student = students.find((s) => s.id === studentIdNum);

      if (!student) throw new Error('Alumno no encontrado.');

      // 1. Obtener sesiones del período para congelar el snapshot métrico
      const { data: periodWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', studentIdNum)
        .gte('workout_date', dateFrom)
        .lte('workout_date', dateTo)
        .order('workout_date', { ascending: true });

      const workoutsList = periodWorkouts || [];
      const totalKm = workoutsList.reduce((acc, w) => acc + (Number(w.distance_km) || 0), 0);
      const totalSeconds = workoutsList.reduce((acc, w) => acc + (Number(w.duration_seconds) || 0), 0);
      const totalElevation = workoutsList.reduce((acc, w) => acc + (Number(w.elevation_gain_m) || 0), 0);

      const paces = workoutsList.filter((w) => w.average_pace_sec_km && w.average_pace_sec_km > 0);
      const avgPace =
        paces.length > 0
          ? Math.round(paces.reduce((acc, w) => acc + (w.average_pace_sec_km || 0), 0) / paces.length)
          : null;

      const hrs = workoutsList.filter((w) => w.average_hr && w.average_hr > 0);
      const avgHr =
        hrs.length > 0
          ? Math.round(hrs.reduce((acc, w) => acc + (w.average_hr || 0), 0) / hrs.length)
          : null;

      const metricsSnapshot = {
        total_workouts: workoutsList.length,
        total_distance_km: Math.round(totalKm * 100) / 100,
        total_duration_seconds: totalSeconds,
        total_elevation_m: totalElevation,
        avg_pace_sec_km: avgPace,
        avg_hr: avgHr,
        workouts_list: workoutsList,
      };

      // 2. Insertar informe
      const { data: newReport, error: insertError } = await supabase
        .from('reports')
        .insert({
          organization_id: student.organization_id,
          student_id: studentIdNum,
          title: title.trim(),
          date_from: dateFrom,
          date_to: dateTo,
          coach_summary: coachSummary.trim() || null,
          metrics_snapshot: metricsSnapshot,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/reports/${newReport.id}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al generar el informe.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Generar Nuevo Informe A4</h1>
          <p className="text-xs text-bardia-rock/60">
            Consolidá el rendimiento del alumno en un período y prepará la devolución técnica.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-bardia-blue" />
              <CardTitle>Configuración del Informe</CardTitle>
            </div>
            <CardDescription>Deportista asignado, título y período evaluado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                  Alumno *
                </label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Seleccionar alumno...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name}, {s.first_name} ({s.discipline})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Título del Informe *"
                required
                placeholder="Ej. Balance Mensual de Carga - Septiembre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha Desde *"
                type="date"
                required
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                label="Fecha Hasta *"
                type="date"
                required
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 text-left pt-2">
              <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                Devolución Técnica y Observaciones del Entrenador
              </label>
              <textarea
                rows={5}
                placeholder="Escribí tu balance profesional: adaptaciones observadas, progresión en desnivel, cumplimiento del plan y recomendaciones para el próximo bloque."
                className="flex w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                value={coachSummary}
                onChange={(e) => setCoachSummary(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/reports">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="gap-2 px-6">
            <CheckCircle2 className="w-4 h-4" />
            <span>Generar y Previsualizar A4</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Cargando formulario...</div>}>
      <ReportFormContent />
    </Suspense>
  );
}
