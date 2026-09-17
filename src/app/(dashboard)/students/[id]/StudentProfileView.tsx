'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Student, Workout, StudentDocument } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPace, formatDuration, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  Activity,
  Mountain,
  FileText,
  HeartPulse,
  TrendingUp,
  User,
  Plus,
  Upload,
  Download,
  Trash2,
  Calendar,
  Layers,
  BarChart2,
  FileCheck,
} from 'lucide-react';

interface StudentProfileViewProps {
  student: Student;
  workouts: Workout[];
  documents: StudentDocument[];
}

export function StudentProfileView({
  student,
  workouts: initialWorkouts,
  documents: initialDocuments,
}: StudentProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'resumen' | 'datos' | 'entrenamientos' | 'evolucion' | 'comparacion' | 'documentos'>('resumen');
  const [workouts] = useState<Workout[]>(initialWorkouts);
  const [documents, setDocuments] = useState<StudentDocument[]>(initialDocuments);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Evolución: selección de métrica para graficar
  const [evolutionMetric, setEvolutionMetric] = useState<'distance_km' | 'elevation_gain_m' | 'average_pace_sec_km'>('distance_km');

  // Comparación: meses seleccionados
  const [periodA] = useState('Últimas 4 semanas');
  const [periodB] = useState('4 semanas previas');

  // Cálculos de métricas globales del alumno
  const totalKm = workouts.reduce((acc, w) => acc + (Number(w.distance_km) || 0), 0);
  const totalElevation = workouts.reduce((acc, w) => acc + (Number(w.elevation_gain_m) || 0), 0);
  const totalSessions = workouts.length;

  // Ritmo promedio en segundos/km
  const workoutsWithPace = workouts.filter((w) => w.average_pace_sec_km && w.average_pace_sec_km > 0);
  const avgPace =
    workoutsWithPace.length > 0
      ? Math.round(workoutsWithPace.reduce((acc, w) => acc + (w.average_pace_sec_km || 0), 0) / workoutsWithPace.length)
      : null;

  // Datos ordenados cronológicamente para el gráfico de evolución
  const chartData = [...workouts]
    .sort((a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime())
    .map((w) => ({
      date: formatDate(w.workout_date),
      distance_km: Number(w.distance_km) || 0,
      elevation_gain_m: Number(w.elevation_gain_m) || 0,
      average_pace_sec_km: w.average_pace_sec_km ? Math.round(w.average_pace_sec_km / 60 * 10) / 10 : 0, // en minutos decimales
    }));

  // Comparación simple de 2 bloques (mitad reciente vs mitad anterior)
  const half = Math.ceil(workouts.length / 2);
  const recentWorkouts = workouts.slice(0, half);
  const previousWorkouts = workouts.slice(half);

  const recentKm = recentWorkouts.reduce((acc, w) => acc + (Number(w.distance_km) || 0), 0);
  const prevKm = previousWorkouts.reduce((acc, w) => acc + (Number(w.distance_km) || 0), 0);
  const deltaKm = prevKm > 0 ? ((recentKm - prevKm) / prevKm) * 100 : 0;

  const recentElev = recentWorkouts.reduce((acc, w) => acc + (Number(w.elevation_gain_m) || 0), 0);
  const prevElev = previousWorkouts.reduce((acc, w) => acc + (Number(w.elevation_gain_m) || 0), 0);
  const deltaElev = prevElev > 0 ? ((recentElev - prevElev) / prevElev) * 100 : 0;

  // Subida de documentos
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !docTitle.trim()) return;

    setIsUploadingDoc(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `org_${student.organization_id}/student_${student.id}/${Date.now()}_${selectedFile.name}`;

      // 1. Subir al bucket privado
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Registrar en la base de datos
      const { data: newDoc, error: dbError } = await supabase
        .from('student_documents')
        .insert({
          organization_id: student.organization_id,
          student_id: student.id,
          title: docTitle.trim(),
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (newDoc) {
        setDocuments([newDoc, ...documents]);
      }

      setDocTitle('');
      setSelectedFile(null);
      router.refresh();
    } catch (err) {
      console.error('Error al subir documento:', err);
      alert('Error al subir el archivo. Comprobá los permisos.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Descarga / Apertura segura mediante URL firmada
  const handleDownloadDoc = async (doc: StudentDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 120); // 2 minutos de vigencia

      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error al generar enlace seguro:', err);
      alert('No se pudo acceder al documento.');
    }
  };

  // Eliminar documento
  const handleDeleteDoc = async (docId: number, filePath: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('student_documents').delete().eq('id', docId);
      setDocuments(documents.filter((d) => d.id !== docId));
      router.refresh();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Alumno */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-bardia-stoneLight pb-5">
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Alumnos</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">
                {student.first_name} {student.last_name}
              </h1>
              <Badge variant="info" className="text-xs">
                {student.discipline}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {student.level}
              </Badge>
            </div>
            <p className="text-xs text-bardia-rock/60 mt-0.5">
              {student.email || 'Sin email'} • {student.phone || 'Sin teléfono'} • Alta: {formatDate(student.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/workouts/new?student_id=${student.id}`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Cargar Sesión</span>
            </Button>
          </Link>
          <Link href={`/reports/new?student_id=${student.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="w-4 h-4 text-bardia-green" />
              <span>Generar Informe A4</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs de Navegación del Alumno */}
      <div className="flex overflow-x-auto border-b border-bardia-stoneLight gap-2 text-xs font-semibold text-bardia-rock/60">
        {[
          { id: 'resumen', label: 'Resumen General', icon: Activity },
          { id: 'datos', label: 'Ficha y Contacto', icon: User },
          { id: 'entrenamientos', label: `Entrenamientos (${workouts.length})`, icon: Calendar },
          { id: 'evolucion', label: 'Evolución Temporal', icon: TrendingUp },
          { id: 'comparacion', label: 'Comparador de Períodos', icon: BarChart2 },
          { id: 'documentos', label: `Documentación (${documents.length})`, icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-bardia-blue text-bardia-blue bg-white shadow-xs font-bold'
                  : 'border-transparent hover:text-bardia-rock hover:border-bardia-stone'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-bardia-cyan' : 'text-bardia-rock/40'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DE TABS */}

      {/* TAB 1: RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Volumen Acumulado"
              value={totalKm.toFixed(1)}
              unit="km"
              icon={TrendingUp}
              subtitle="En entrenamientos registrados"
            />
            <StatCard
              title="Desnivel Positivo"
              value={totalElevation.toLocaleString('es-AR')}
              unit="+m"
              icon={Mountain}
              subtitle="Ascenso en bardas y montaña"
            />
            <StatCard
              title="Ritmo Promedio"
              value={formatPace(avgPace)}
              icon={Activity}
              subtitle="Promedio ponderado"
            />
            <StatCard
              title="Total Sesiones"
              value={totalSessions}
              unit="sesiones"
              icon={Calendar}
              subtitle="Historial cargado"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Objetivos y Notas (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos y Notas Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-bardia-blue block mb-1">Objetivos Deportivos:</span>
                    <p className="text-bardia-rock/70 bg-bardia-snow p-3 rounded border border-bardia-border leading-relaxed">
                      {student.sport_goals || 'No se han registrado metas específicas aún.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-bardia-blue block mb-1">Observaciones del Entrenador:</span>
                    <p className="text-bardia-rock/70 bg-bardia-snow p-3 rounded border border-bardia-border leading-relaxed">
                      {student.coach_notes || 'Sin observaciones técnicas cargadas.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Últimas sesiones */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Últimas Sesiones del Alumno</CardTitle>
                  <button
                    onClick={() => setActiveTab('entrenamientos')}
                    className="text-xs font-semibold text-bardia-blue hover:text-bardia-cyan"
                  >
                    Ver todas
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  {workouts.length > 0 ? (
                    <div className="divide-y divide-bardia-stoneLight">
                      {workouts.slice(0, 4).map((w) => (
                        <div key={w.id} className="p-4 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-bardia-blue">{w.title}</div>
                            <div className="text-bardia-rock/50 mt-0.5">
                              {formatDate(w.workout_date)} • {w.workout_type}
                            </div>
                          </div>
                          <div className="text-right">
                            {w.distance_km && <div className="font-bold text-bardia-blue">{w.distance_km} km</div>}
                            {w.elevation_gain_m && <div className="text-bardia-green font-medium">+{w.elevation_gain_m}m</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-6 text-center text-xs text-bardia-rock/50">Sin sesiones cargadas todavía.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ficha de Emergencia Rápida */}
            <div>
              <Card className="border-emerald-200 bg-emerald-50/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-emerald-950 text-sm">Ficha de Emergencia</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-900/60 text-[11px]">
                    Acceso prioritario para salidas de terreno y competencias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-bardia-rock/50 block text-[11px]">Contacto:</span>
                    <span className="font-semibold text-bardia-rock">
                      {student.emergency_contact_name || 'No especificado'}
                    </span>
                    {student.emergency_contact_relation && (
                      <span className="text-bardia-rock/50 text-[11px]"> ({student.emergency_contact_relation})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-bardia-rock/50 block text-[11px]">Teléfono de urgencia:</span>
                    <span className="font-semibold text-emerald-800">
                      {student.emergency_contact_phone || 'Sin número'}
                    </span>
                  </div>
                  <div>
                    <span className="text-bardia-rock/50 block text-[11px]">Cobertura médica / Obra social:</span>
                    <span className="font-semibold text-bardia-rock">
                      {student.medical_insurance || 'No registrada'}
                    </span>
                    {student.medical_insurance_number && (
                      <div className="text-[11px] text-bardia-rock/60">N° {student.medical_insurance_number}</div>
                    )}
                  </div>
                  {student.emergency_notes && (
                    <div className="pt-2 border-t border-emerald-100">
                      <span className="text-bardia-rock/50 block text-[11px]">Observaciones médicas:</span>
                      <p className="text-bardia-rock/80 text-[11px] italic mt-0.5">{student.emergency_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATOS */}
      {activeTab === 'datos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal y Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">Nombre completo:</span>
                <span className="font-semibold">{student.first_name} {student.last_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">Email:</span>
                <span className="font-semibold">{student.email || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">Teléfono:</span>
                <span className="font-semibold">{student.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">Fecha de Nacimiento:</span>
                <span className="font-semibold">{formatDate(student.birth_date)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">DNI / Identificación:</span>
                <span className="font-semibold">{student.id_number || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfil Deportivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">Disciplina:</span>
                <span className="font-semibold">{student.discipline}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60">Nivel Actual:</span>
                <span className="font-semibold">{student.level}</span>
              </div>
              <div className="py-2 border-b border-bardia-stoneLight">
                <span className="text-bardia-rock/60 block mb-1">Metas:</span>
                <p className="font-medium text-bardia-rock/80">{student.sport_goals || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: ENTRENAMIENTOS */}
      {activeTab === 'entrenamientos' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historial de Entrenamientos</CardTitle>
              <CardDescription>Registro cronológico de sesiones cargadas</CardDescription>
            </div>
            <Link href={`/workouts/new?student_id=${student.id}`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Cargar Sesión</span>
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {workouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bardia-snow border-y border-bardia-stoneLight text-bardia-rock/60 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Título / Tipo</th>
                      <th className="p-3">Distancia</th>
                      <th className="p-3">Tiempo</th>
                      <th className="p-3">Ritmo</th>
                      <th className="p-3">Desnivel</th>
                      <th className="p-3">FC Media</th>
                      <th className="p-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bardia-stoneLight">
                    {workouts.map((w) => (
                      <tr key={w.id} className="hover:bg-bardia-snow/60">
                        <td className="p-3 font-semibold text-bardia-blue whitespace-nowrap">
                          {formatDate(w.workout_date)}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-bardia-rock">{w.title}</div>
                          <span className="text-[10px] text-bardia-rock/50 uppercase">{w.workout_type}</span>
                        </td>
                        <td className="p-3 font-bold text-bardia-blue">
                          {w.distance_km ? `${w.distance_km} km` : '-'}
                        </td>
                        <td className="p-3 text-bardia-rock/70">{formatDuration(w.duration_seconds)}</td>
                        <td className="p-3 font-medium text-bardia-rock">{formatPace(w.average_pace_sec_km)}</td>
                        <td className="p-3 font-semibold text-bardia-green">
                          {w.elevation_gain_m ? `+${w.elevation_gain_m}m` : '-'}
                        </td>
                        <td className="p-3 text-bardia-rock/70">{w.average_hr ? `${w.average_hr} bpm` : '-'}</td>
                        <td className="p-3 text-bardia-rock/60 max-w-xs truncate">{w.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="Sin entrenamientos registrados"
                description="Registrá la primera sesión para empezar a computar estadísticas y gráficos de progresión."
                actionLabel="Cargar Entrenamiento"
                onAction={() => router.push(`/workouts/new?student_id=${student.id}`)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: EVOLUCIÓN */}
      {activeTab === 'evolucion' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Curva de Evolución Temporal</CardTitle>
                <CardDescription>Análisis de tendencia y progresión a través de los entrenamientos</CardDescription>
              </div>

              {/* Selector de Métrica */}
              <div className="flex bg-bardia-snow p-1 rounded-md border border-bardia-border text-xs font-semibold">
                <button
                  onClick={() => setEvolutionMetric('distance_km')}
                  className={`px-3 py-1 rounded transition-all ${
                    evolutionMetric === 'distance_km'
                      ? 'bg-white text-bardia-blue shadow-xs font-bold'
                      : 'text-bardia-rock/60 hover:text-bardia-rock'
                  }`}
                >
                  Distancia (km)
                </button>
                <button
                  onClick={() => setEvolutionMetric('elevation_gain_m')}
                  className={`px-3 py-1 rounded transition-all ${
                    evolutionMetric === 'elevation_gain_m'
                      ? 'bg-white text-bardia-blue shadow-xs font-bold'
                      : 'text-bardia-rock/60 hover:text-bardia-rock'
                  }`}
                >
                  Desnivel (+m)
                </button>
                <button
                  onClick={() => setEvolutionMetric('average_pace_sec_km')}
                  className={`px-3 py-1 rounded transition-all ${
                    evolutionMetric === 'average_pace_sec_km'
                      ? 'bg-white text-bardia-blue shadow-xs font-bold'
                      : 'text-bardia-rock/60 hover:text-bardia-rock'
                  }`}
                >
                  Ritmo (min/km)
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length >= 2 ? (
                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bardiaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#72B7C9" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#72B7C9" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D9E0DE" vertical={false} />
                      <XAxis dataKey="date" stroke="#172127" opacity={0.6} tick={{ fontSize: 11 }} />
                      <YAxis stroke="#172127" opacity={0.6} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#17324D',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={evolutionMetric}
                        stroke="#17324D"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#bardiaGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="Insuficientes datos para graficar evolución"
                  description="Se requieren al menos 2 entrenamientos registrados para proyectar la curva evolutiva."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: COMPARACIÓN */}
      {activeTab === 'comparacion' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Períodos de Entrenamiento</CardTitle>
              <CardDescription>
                Evalúa la variación de volumen y desnivel entre dos bloques de trabajo para medir la carga de entrenamiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {workouts.length >= 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Período A */}
                  <div className="p-5 rounded-lg bg-bardia-snow border border-bardia-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-bardia-blue">
                        Período Reciente (Bloque A)
                      </span>
                      <Badge variant="info">Sesiones recientes</Badge>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-bardia-rock/60">Sesiones:</span>
                        <span className="font-bold text-bardia-blue">{recentWorkouts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bardia-rock/60">Distancia Total:</span>
                        <span className="font-bold text-bardia-blue">{recentKm.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bardia-rock/60">Desnivel Acumulado:</span>
                        <span className="font-bold text-bardia-green">+{recentElev}m</span>
                      </div>
                    </div>
                  </div>

                  {/* Período B */}
                  <div className="p-5 rounded-lg bg-white border border-bardia-border shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-bardia-rock/70">
                        Período Anterior (Bloque B)
                      </span>
                      <Badge variant="outline">Bloque de referencia</Badge>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-bardia-rock/60">Sesiones:</span>
                        <span className="font-bold text-bardia-rock">{previousWorkouts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bardia-rock/60">Distancia Total:</span>
                        <span className="font-bold text-bardia-rock">{prevKm.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bardia-rock/60">Desnivel Acumulado:</span>
                        <span className="font-bold text-bardia-rock">+{prevElev}m</span>
                      </div>
                    </div>
                  </div>

                  {/* Diferencial / Delta */}
                  <div className="md:col-span-2 p-5 rounded-lg bg-bardia-blue text-white flex flex-col sm:flex-row sm:items-center sm:justify-around gap-4 text-center">
                    <div>
                      <span className="text-xs text-bardia-cyan uppercase tracking-wider block mb-1">
                        Variación de Volumen
                      </span>
                      <div className="text-2xl font-bold">
                        {deltaKm >= 0 ? `+${deltaKm.toFixed(1)}%` : `${deltaKm.toFixed(1)}%`}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/20 hidden sm:block" />
                    <div>
                      <span className="text-xs text-bardia-cyan uppercase tracking-wider block mb-1">
                        Variación de Desnivel
                      </span>
                      <div className="text-2xl font-bold">
                        {deltaElev >= 0 ? `+${deltaElev.toFixed(1)}%` : `${deltaElev.toFixed(1)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart2}
                  title="Sin suficientes entrenamientos para comparar"
                  description="Cargá más entrenamientos a lo largo de las semanas para contrastar bloques y fases de carga."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: DOCUMENTACIÓN */}
      {activeTab === 'documentos' && (
        <div className="space-y-6">
          {/* Subida de nuevo documento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-bardia-blue" />
                <CardTitle>Subir Nuevo Documento / Apto Físico</CardTitle>
              </div>
              <CardDescription>
                Almacená certificados médicos, ergometrías y documentación técnica del alumno en el storage seguro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadDocument} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                    Título del Documento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apto Físico 2026, Ergometría"
                    className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                    Archivo (PDF, PNG, JPG) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-3 py-1.5 text-xs text-bardia-rock file:border-0 file:bg-bardia-snow file:text-xs file:font-semibold file:text-bardia-blue file:mr-3 focus:outline-none"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button type="submit" isLoading={isUploadingDoc} className="gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Subir Archivo Seguro</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Listado de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Almacenados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {documents.length > 0 ? (
                <div className="divide-y divide-bardia-stoneLight">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between text-xs hover:bg-bardia-snow/60">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-bardia-snow text-bardia-blue">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-bardia-blue">{doc.title}</div>
                          <div className="text-[11px] text-bardia-rock/50 mt-0.5">
                            {doc.file_name} • Subido el {formatDate(doc.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDoc(doc)}
                          className="gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-bardia-blue" />
                          <span>Descargar / Ver</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDoc(doc.id, doc.file_path)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileCheck}
                  title="No hay documentación almacenada"
                  description="Subí el apto físico o ficha médica de este alumno para conservarla en un solo lugar seguro."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
