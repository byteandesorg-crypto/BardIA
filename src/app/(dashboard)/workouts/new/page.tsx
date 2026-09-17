'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { formatPace, calculatePace } from '@/lib/utils';
import { ArrowLeft, Activity, Mountain, Clock, Heart, Plus } from 'lucide-react';

function WorkoutFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('Fondo de Barda');
  const [notes, setNotes] = useState('');

  // Métricas
  const [distanceKm, setDistanceKm] = useState('');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [durationSeconds, setDurationSeconds] = useState('0');
  const [elevationGain, setElevationGain] = useState('');
  const [averageHr, setAverageHr] = useState('');
  const [maxHr, setMaxHr] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular segundos totales de duración
  const totalDurationSec =
    (parseInt(durationHours, 10) || 0) * 3600 +
    (parseInt(durationMinutes, 10) || 0) * 60 +
    (parseInt(durationSeconds, 10) || 0);

  // Calcular ritmo medio automático
  const distNum = parseFloat(distanceKm);
  const computedPaceSec = calculatePace(distNum > 0 ? distNum : null, totalDurationSec > 0 ? totalDurationSec : null);

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

      const { data: newWorkout, error: insertError } = await supabase
        .from('workouts')
        .insert({
          organization_id: student.organization_id,
          student_id: studentIdNum,
          workout_date: workoutDate,
          title: title.trim() || `${workoutType} - ${workoutDate}`,
          workout_type: workoutType,
          notes: notes.trim() || null,
          distance_km: distNum > 0 ? distNum : null,
          duration_seconds: totalDurationSec > 0 ? totalDurationSec : null,
          elevation_gain_m: elevationGain ? parseInt(elevationGain, 10) : null,
          average_pace_sec_km: computedPaceSec,
          average_hr: averageHr ? parseInt(averageHr, 10) : null,
          max_hr: maxHr ? parseInt(maxHr, 10) : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/students/${studentIdNum}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al registrar el entrenamiento.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workouts">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Carga Rápida de Entrenamiento</h1>
          <p className="text-xs text-bardia-rock/60">
            Registrá la sesión deportiva del alumno con cálculo automático de ritmos y desniveles.
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
              <Activity className="w-4 h-4 text-bardia-blue" />
              <CardTitle>Datos de la Sesión</CardTitle>
            </div>
            <CardDescription>Información general y tipología de entrenamiento</CardDescription>
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
                label="Fecha de Entrenamiento *"
                type="date"
                required
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título de la Sesión"
                placeholder="Ej. Fondo Barda Norte 15k, Cuestas Balcón del Valle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                  Tipo de Entrenamiento
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                >
                  <option value="Fondo de Barda">Fondo de Barda / Trail</option>
                  <option value="Cuestas / Altimetría">Cuestas / Altimetría</option>
                  <option value="Pasadas / Intervalos">Pasadas / Intervalos</option>
                  <option value="Regenerativo">Regenerativo</option>
                  <option value="Trekking / Ascenso">Trekking / Ascenso</option>
                  <option value="Running Calle">Running Calle</option>
                  <option value="Fuerza / Funcional">Fuerza / Funcional</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Cuantitativas */}
        <Card className="border-bardia-cyan/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-bardia-cyan" />
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </div>
              {computedPaceSec ? (
                <div className="bg-bardia-snow px-3 py-1 rounded border border-bardia-stone text-xs font-bold text-bardia-blue">
                  ⚡ Ritmo Calculado: <span className="text-bardia-cyan font-extrabold">{formatPace(computedPaceSec)}</span>
                </div>
              ) : null}
            </div>
            <CardDescription>Distancia, tiempo, altimetría y frecuencia cardíaca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Distancia (km)"
                type="number"
                step="0.01"
                placeholder="12.5"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                  Duración (Horas : Minutos : Segundos)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Horas"
                    className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-2 py-2 text-sm text-center text-bardia-rock focus:border-bardia-cyan focus:outline-none"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Minutos"
                    className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-2 py-2 text-sm text-center text-bardia-rock focus:border-bardia-cyan focus:outline-none"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Segundos"
                    className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-2 py-2 text-sm text-center text-bardia-rock focus:border-bardia-cyan focus:outline-none"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Desnivel Positivo (+m)"
                type="number"
                placeholder="320"
                value={elevationGain}
                onChange={(e) => setElevationGain(e.target.value)}
                helperText="Ascenso acumulado en barda/cerro"
              />

              <Input
                label="FC Media (bpm)"
                type="number"
                placeholder="152"
                value={averageHr}
                onChange={(e) => setAverageHr(e.target.value)}
              />

              <Input
                label="FC Máxima (bpm)"
                type="number"
                placeholder="178"
                value={maxHr}
                onChange={(e) => setMaxHr(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 text-left pt-2">
              <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                Observaciones del Entrenador / Sensaciones
              </label>
              <textarea
                rows={3}
                placeholder="Terreno seco, buena cadencia en subidas pronunciadas, mantener hidratación."
                className="flex w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/workouts">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="px-6">
            Guardar Entrenamiento
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Cargando formulario...</div>}>
      <WorkoutFormContent />
    </Suspense>
  );
}
