'use client';

import React, { useState, useMemo } from 'react';
import { Workout } from '@/types/database';
import { formatPace, formatDuration, formatElevation, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  Mountain,
  Gauge,
  Flame,
  Zap,
  Footprints,
  Compass,
  Dumbbell,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface WorkoutTypeEvolutionProps {
  workouts: Workout[];
}

// Icono y color semántico según el tipo de entrenamiento
function getWorkoutTypeMeta(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('cuesta') || lower.includes('altimetr') || lower.includes('desnivel')) {
    return {
      icon: Mountain,
      color: '#3E6653',
      bgLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      strokeColor: '#2D8A66',
      badge: 'Altimetría',
    };
  }
  if (lower.includes('pasada') || lower.includes('interval') || lower.includes('series')) {
    return {
      icon: Zap,
      color: '#D97706',
      bgLight: 'bg-amber-50 text-amber-800 border-amber-200',
      strokeColor: '#D97706',
      badge: 'Velocidad',
    };
  }
  if (lower.includes('fondo') || lower.includes('trail') || lower.includes('larga')) {
    return {
      icon: Compass,
      color: '#17324D',
      bgLight: 'bg-sky-50 text-sky-900 border-sky-200',
      strokeColor: '#17324D',
      badge: 'Resistencia',
    };
  }
  if (lower.includes('regenerativo') || lower.includes('suave') || lower.includes('recupera')) {
    return {
      icon: Footprints,
      color: '#72B7C9',
      bgLight: 'bg-teal-50 text-teal-800 border-teal-200',
      strokeColor: '#0D9488',
      badge: 'Recuperación',
    };
  }
  if (lower.includes('fuerza') || lower.includes('funcional') || lower.includes('gimnasio')) {
    return {
      icon: Dumbbell,
      color: '#6366F1',
      bgLight: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      strokeColor: '#6366F1',
      badge: 'Fuerza',
    };
  }
  return {
    icon: Activity,
    color: '#17324D',
    bgLight: 'bg-slate-50 text-slate-800 border-slate-200',
    strokeColor: '#17324D',
    badge: 'Running',
  };
}

interface TypeTooltipPayload {
  payload: {
    date: string;
    title?: string;
    distanceKm: number;
    elevationGainM: number;
    paceFormatted?: string;
    durationFormatted?: string;
  };
}

function TypeChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TypeTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-bardia-blue text-white p-2.5 rounded-md shadow-lg text-[11px] min-w-[150px] border border-white/10">
      <div className="font-bold text-white mb-0.5">{data.title || label}</div>
      <div className="text-white/60 text-[10px] mb-1.5">{label}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-bardia-cyan">Distancia:</span>
          <span className="font-bold">{data.distanceKm} km</span>
        </div>
        {data.elevationGainM > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-emerald-400">Desnivel:</span>
            <span className="font-bold">+{data.elevationGainM} m</span>
          </div>
        )}
        {data.paceFormatted && data.paceFormatted !== '-' && (
          <div className="flex justify-between gap-3">
            <span className="text-amber-400">Ritmo:</span>
            <span className="font-bold">{data.paceFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkoutTypeEvolution({ workouts }: WorkoutTypeEvolutionProps) {
  // Agrupar entrenamientos por tipo
  const typesData = useMemo(() => {
    const map = new Map<string, Workout[]>();

    workouts.forEach((w) => {
      const type = w.workout_type || 'General';
      if (!map.has(type)) {
        map.set(type, []);
      }
      map.get(type)!.push(w);
    });

    // Ordenar cronológicamente cada lista de tipo
    const result: Array<{
      type: string;
      workouts: Workout[];
      totalKm: number;
      totalElevation: number;
      totalDuration: number;
      avgPaceSec: number | null;
      bestPaceSec: number | null;
    }> = [];

    map.forEach((wList, type) => {
      const sorted = [...wList].sort(
        (a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
      );

      const totalKm = sorted.reduce((acc, w) => acc + (Number(w.distance_km) || 0), 0);
      const totalElevation = sorted.reduce((acc, w) => acc + (Number(w.elevation_gain_m) || 0), 0);
      const totalDuration = sorted.reduce((acc, w) => acc + (Number(w.duration_seconds) || 0), 0);

      const paces = sorted
        .map((w) => w.average_pace_sec_km)
        .filter((p): p is number => p !== null && p !== undefined && p > 0);

      const avgPaceSec = paces.length > 0 ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : null;
      const bestPaceSec = paces.length > 0 ? Math.min(...paces) : null;

      result.push({
        type,
        workouts: sorted,
        totalKm,
        totalElevation,
        totalDuration,
        avgPaceSec,
        bestPaceSec,
      });
    });

    // Ordenar tipos por cantidad de sesiones descendente
    return result.sort((a, b) => b.workouts.length - a.workouts.length);
  }, [workouts]);

  // Tipo seleccionado ('ALL' = galería de todos, o el nombre del tipo)
  const [selectedType, setSelectedType] = useState<string>('ALL');

  if (typesData.length === 0) {
    return (
      <div className="text-center py-12 text-bardia-rock/50 text-xs bg-bardia-snow rounded-lg border border-bardia-border">
        No hay sesiones suficientes clasificadas por tipo para generar las curvas evolutivas.
      </div>
    );
  }

  const activeGroup = typesData.find((g) => g.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Entrenamiento (Pills) */}
      <div className="flex flex-wrap items-center gap-2 bg-bardia-snow p-2.5 rounded-lg border border-bardia-border text-xs">
        <button
          type="button"
          onClick={() => setSelectedType('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
            selectedType === 'ALL'
              ? 'bg-bardia-blue text-white shadow-xs'
              : 'bg-white text-bardia-rock/70 hover:text-bardia-rock border border-bardia-stone'
          }`}
        >
          <span>Todos los Tipos</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
            {typesData.reduce((acc, t) => acc + t.workouts.length, 0)}
          </span>
        </button>

        {typesData.map((group) => {
          const meta = getWorkoutTypeMeta(group.type);
          const Icon = meta.icon;
          const isSelected = selectedType === group.type;

          return (
            <button
              key={group.type}
              type="button"
              onClick={() => setSelectedType(group.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                isSelected
                  ? 'bg-bardia-blue text-white shadow-xs'
                  : 'bg-white text-bardia-rock/70 hover:text-bardia-rock border border-bardia-stone'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{group.type}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-bardia-snow text-bardia-blue'
                }`}
              >
                {group.workouts.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* MODO 1: TIPO INDIVIDUAL SELECCIONADO */}
      {selectedType !== 'ALL' && activeGroup && (
        <SingleTypeEvolutionView group={activeGroup} onBack={() => setSelectedType('ALL')} />
      )}

      {/* MODO 2: GALERÍA DE TODOS LOS TIPOS (VISTA COMPARATIVA) */}
      {selectedType === 'ALL' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {typesData.map((group) => {
            const meta = getWorkoutTypeMeta(group.type);
            const Icon = meta.icon;

            const chartPoints = group.workouts.map((w) => ({
              date: formatDate(w.workout_date),
              distanceKm: Number(w.distance_km) || 0,
              elevationGainM: Number(w.elevation_gain_m) || 0,
              paceMinKm:
                w.average_pace_sec_km && w.average_pace_sec_km > 0
                  ? Math.round((w.average_pace_sec_km / 60) * 100) / 100
                  : null,
              paceFormatted: formatPace(w.average_pace_sec_km),
              title: w.title,
            }));

            return (
              <div
                key={group.type}
                className="bg-white rounded-lg border border-bardia-border p-5 shadow-xs hover:border-bardia-cyan/50 transition-all space-y-4"
              >
                {/* Encabezado de la Tarjeta del Tipo */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${meta.bgLight}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-bardia-blue">{group.type}</h4>
                      <span className="text-[11px] text-bardia-rock/50">
                        {group.workouts.length} {group.workouts.length === 1 ? 'sesión' : 'sesiones'} registradas
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedType(group.type)}
                    className="text-xs font-semibold text-bardia-cyan hover:text-bardia-blue"
                  >
                    Ver detalle →
                  </button>
                </div>

                {/* KPIs Rápidos del Tipo */}
                <div className="grid grid-cols-3 gap-2 bg-bardia-snow p-2.5 rounded-md border border-bardia-stoneLight text-center text-xs">
                  <div>
                    <span className="text-[10px] text-bardia-rock/50 uppercase block font-semibold">Distancia</span>
                    <span className="font-bold text-bardia-blue">{group.totalKm.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-bardia-rock/50 uppercase block font-semibold">Desnivel</span>
                    <span className="font-bold text-bardia-green">+{group.totalElevation} m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-bardia-rock/50 uppercase block font-semibold">Ritmo Medio</span>
                    <span className="font-bold text-amber-700">{formatPace(group.avgPaceSec)}</span>
                  </div>
                </div>

                {/* Minigráfico de Evolución del Tipo */}
                {chartPoints.length >= 2 ? (
                  <div className="h-44 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartPoints} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E6" vertical={false} />
                        <XAxis dataKey="date" stroke="#172127" opacity={0.6} tick={{ fontSize: 10 }} />
                        <YAxis stroke="#172127" opacity={0.6} tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                        <Tooltip content={<TypeChartTooltip />} />
                        <Bar
                          dataKey="distanceKm"
                          name="Distancia (km)"
                          fill={meta.strokeColor}
                          opacity={0.8}
                          radius={[3, 3, 0, 0]}
                        />
                        {group.totalElevation > 0 && (
                          <Line
                            type="monotone"
                            dataKey="elevationGainM"
                            name="Desnivel (+m)"
                            stroke="#3E6653"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-center text-xs text-bardia-rock/40 bg-bardia-snow/50 rounded border border-dashed border-bardia-stone">
                    1 sola sesión registrada. Cargá más sesiones para proyectar tendencia.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Vista detallada de un tipo de entrenamiento específico
function SingleTypeEvolutionView({
  group,
  onBack,
}: {
  group: {
    type: string;
    workouts: Workout[];
    totalKm: number;
    totalElevation: number;
    totalDuration: number;
    avgPaceSec: number | null;
    bestPaceSec: number | null;
  };
  onBack: () => void;
}) {
  const meta = getWorkoutTypeMeta(group.type);
  const Icon = meta.icon;

  const chartData = group.workouts.map((w) => {
    const paceSec = w.average_pace_sec_km && w.average_pace_sec_km > 0 ? w.average_pace_sec_km : null;
    const paceMin = paceSec ? Math.round((paceSec / 60) * 100) / 100 : null;

    return {
      date: formatDate(w.workout_date),
      rawDate: w.workout_date,
      title: w.title,
      distanceKm: Number(w.distance_km) || 0,
      elevationGainM: Number(w.elevation_gain_m) || 0,
      paceMinKm: paceMin,
      paceFormatted: formatPace(paceSec),
      durationFormatted: formatDuration(w.duration_seconds || 0),
    };
  });

  return (
    <div className="bg-white rounded-lg border border-bardia-border p-6 shadow-xs space-y-6">
      {/* Cabecera del Tipo Seleccionado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-bardia-stoneLight">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg border ${meta.bgLight}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-bardia-blue">{group.type}</h3>
              <Badge variant="default" className="text-[10px]">
                {meta.badge}
              </Badge>
            </div>
            <p className="text-xs text-bardia-rock/60 mt-0.5">
              Evolución cronológica de rendimiento y adaptación en este tipo de estímulo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-bardia-rock/70 hover:text-bardia-blue px-3 py-1.5 rounded border border-bardia-stone hover:bg-bardia-snow transition-all self-start sm:self-auto"
        >
          ← Volver a todos los tipos
        </button>
      </div>

      {/* Tarjetas de Métricas Clave del Tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-bardia-snow border border-bardia-border">
          <span className="text-[10px] uppercase font-bold text-bardia-rock/50 block">Sesiones Totales</span>
          <span className="text-2xl font-bold text-bardia-blue">{group.workouts.length}</span>
          <span className="text-xs text-bardia-rock/50 ml-1">entrenamientos</span>
        </div>

        <div className="p-4 rounded-lg bg-bardia-snow border border-bardia-border">
          <span className="text-[10px] uppercase font-bold text-bardia-rock/50 block">Volumen Acumulado</span>
          <span className="text-2xl font-bold text-bardia-blue">{group.totalKm.toFixed(1)}</span>
          <span className="text-xs text-bardia-rock/50 ml-1">km</span>
        </div>

        <div className="p-4 rounded-lg bg-bardia-snow border border-bardia-border">
          <span className="text-[10px] uppercase font-bold text-bardia-rock/50 block">Desnivel Acumulado</span>
          <span className="text-2xl font-bold text-bardia-green">+{group.totalElevation}</span>
          <span className="text-xs text-bardia-rock/50 ml-1">m</span>
        </div>

        <div className="p-4 rounded-lg bg-bardia-snow border border-bardia-border">
          <span className="text-[10px] uppercase font-bold text-bardia-rock/50 block">Ritmo Promedio</span>
          <span className="text-2xl font-bold text-amber-600">{formatPace(group.avgPaceSec)}</span>
          {group.bestPaceSec && (
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              Mejor: {formatPace(group.bestPaceSec)}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Evolución del Tipo */}
      {chartData.length >= 2 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-bardia-blue">
            Curva de Rendimiento en {group.type}
          </h4>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9E0DE" vertical={false} />
                <XAxis dataKey="date" stroke="#172127" opacity={0.7} tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="distance"
                  orientation="left"
                  stroke={meta.strokeColor}
                  tick={{ fontSize: 11, fill: meta.strokeColor }}
                  tickFormatter={(val) => `${val}k`}
                  width={38}
                />
                <YAxis
                  yAxisId="elevation"
                  orientation="right"
                  stroke="#3E6653"
                  tick={{ fontSize: 11, fill: '#3E6653' }}
                  tickFormatter={(val) => `+${val}m`}
                  width={48}
                />
                <Tooltip content={<TypeChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(value) => <span className="text-xs font-semibold text-bardia-rock">{value}</span>}
                />
                <Area
                  yAxisId="elevation"
                  type="monotone"
                  dataKey="elevationGainM"
                  name="Desnivel (+m)"
                  fill="#3E6653"
                  fillOpacity={0.15}
                  stroke="#3E6653"
                  strokeWidth={2}
                />
                <Bar
                  yAxisId="distance"
                  dataKey="distanceKm"
                  name="Distancia (km)"
                  fill={meta.strokeColor}
                  opacity={0.88}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-bardia-rock/50 bg-bardia-snow rounded-lg border border-bardia-border">
          Se requiere registrar más sesiones de <strong>{group.type}</strong> para trazar la curva de progresión.
        </div>
      )}

      {/* Historial Cronológico de Sesiones de este Tipo */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-bardia-blue">
          Historial de Sesiones — {group.type}
        </h4>

        <div className="overflow-x-auto rounded-lg border border-bardia-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-bardia-snow text-bardia-rock/60 uppercase text-[10px] tracking-wider border-b border-bardia-stoneLight">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Título</th>
                <th className="p-3">Distancia</th>
                <th className="p-3">Duración</th>
                <th className="p-3">Ritmo</th>
                <th className="p-3">Desnivel</th>
                <th className="p-3">FC Media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bardia-stoneLight">
              {group.workouts.map((w) => (
                <tr key={w.id} className="hover:bg-bardia-snow/60">
                  <td className="p-3 font-semibold text-bardia-blue whitespace-nowrap">
                    {formatDate(w.workout_date)}
                  </td>
                  <td className="p-3 font-medium text-bardia-rock">{w.title || '-'}</td>
                  <td className="p-3 font-bold text-bardia-blue">{w.distance_km ? `${w.distance_km} km` : '-'}</td>
                  <td className="p-3 text-bardia-rock/70">{formatDuration(w.duration_seconds)}</td>
                  <td className="p-3 font-semibold text-amber-700">{formatPace(w.average_pace_sec_km)}</td>
                  <td className="p-3 font-semibold text-bardia-green">
                    {w.elevation_gain_m ? `+${w.elevation_gain_m}m` : '-'}
                  </td>
                  <td className="p-3 text-bardia-rock/70">{w.average_hr ? `${w.average_hr} bpm` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
