'use client';

import React, { useState, useMemo } from 'react';
import { Workout } from '@/types/database';
import { formatPace, formatDuration, formatElevation, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Activity, Mountain, Gauge, Layers, Info } from 'lucide-react';

interface CombinedEvolutionChartProps {
  workouts: Workout[];
}

interface CustomTooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload: {
    title: string;
    workoutType: string;
    rawDate: string;
    distanceKm: number;
    elevationGainM: number;
    paceFormatted: string;
    durationFormatted: string;
    averageHr: number | null;
  };
}

export function CombinedEvolutionChart({ workouts }: CombinedEvolutionChartProps) {
  // Controles de visibilidad de cada métrica
  const [showDistance, setShowDistance] = useState(true);
  const [showElevation, setShowElevation] = useState(true);
  const [showPace, setShowPace] = useState(true);

  // Procesamiento y ordenamiento cronológico de datos
  const chartData = useMemo(() => {
    return [...workouts]
      .filter((w) => w.workout_date)
      .sort((a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime())
      .map((w) => {
        const paceSec = w.average_pace_sec_km && w.average_pace_sec_km > 0 ? w.average_pace_sec_km : null;
        const paceMin = paceSec ? Math.round((paceSec / 60) * 100) / 100 : null;

        return {
          id: w.id,
          date: formatDate(w.workout_date),
          rawDate: w.workout_date,
          title: w.title || 'Entrenamiento',
          workoutType: w.workout_type || 'General',
          distanceKm: Number(w.distance_km) || 0,
          elevationGainM: Number(w.elevation_gain_m) || 0,
          paceMinKm: paceMin,
          paceFormatted: formatPace(paceSec),
          durationFormatted: formatDuration(w.duration_seconds || 0),
          averageHr: w.average_hr || null,
        };
      });
  }, [workouts]);

  // Cálculo de dominio para el ritmo en minutos decimales
  const paceDomain = useMemo(() => {
    const validPaces = chartData
      .map((d) => d.paceMinKm)
      .filter((p): p is number => p !== null && p > 0);

    if (validPaces.length === 0) return [3, 8];
    const min = Math.max(2, Math.floor(Math.min(...validPaces) - 0.5));
    const max = Math.ceil(Math.max(...validPaces) + 0.5);
    return [min, max];
  }, [chartData]);

  // Formateador de etiquetas del eje Y de ritmo (min:seg)
  const formatPaceTick = (val: number) => {
    const min = Math.floor(val);
    const sec = Math.round((val - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Tooltip personalizado con las 3 métricas
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: CustomTooltipPayload[];
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-bardia-blue text-white p-3.5 rounded-lg shadow-xl border border-bardia-cyan/30 text-xs min-w-[220px]">
        <div className="border-b border-white/10 pb-2 mb-2">
          <div className="font-bold text-sm text-white">{data.title}</div>
          <div className="flex items-center justify-between text-[11px] text-white/70 mt-0.5">
            <span>{label}</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-bardia-cyan font-semibold">
              {data.workoutType}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-bardia-cyan">
              <Activity className="w-3.5 h-3.5" />
              <span>Distancia:</span>
            </span>
            <span className="font-bold text-white">{data.distanceKm} km</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Mountain className="w-3.5 h-3.5" />
              <span>Desnivel:</span>
            </span>
            <span className="font-bold text-white">{formatElevation(data.elevationGainM)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Gauge className="w-3.5 h-3.5" />
              <span>Ritmo:</span>
            </span>
            <span className="font-bold text-white">{data.paceFormatted}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-white/60">
            <span>Duración:</span>
            <span>{data.durationFormatted}</span>
          </div>

          {data.averageHr && (
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>FC Media:</span>
              <span className="text-rose-300 font-semibold">{data.averageHr} bpm</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (chartData.length < 2) {
    return (
      <div className="text-center py-12 text-bardia-rock/50 text-xs bg-bardia-snow rounded-lg border border-bardia-border">
        Se necesitan al menos 2 sesiones para graficar la evolución combinada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Leyenda Interactiva */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-bardia-snow p-3 rounded-lg border border-bardia-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-bardia-blue">
          <Layers className="w-4 h-4 text-bardia-cyan" />
          <span>Métricas en el Gráfico:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Toggle Distancia */}
          <button
            type="button"
            onClick={() => setShowDistance(!showDistance)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
              showDistance
                ? 'bg-bardia-blue text-white border-bardia-blue shadow-xs'
                : 'bg-white text-bardia-rock/50 border-bardia-stone hover:text-bardia-rock'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-bardia-cyan"></span>
            <span>Distancia (km)</span>
          </button>

          {/* Toggle Desnivel */}
          <button
            type="button"
            onClick={() => setShowElevation(!showElevation)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
              showElevation
                ? 'bg-bardia-green text-white border-bardia-green shadow-xs'
                : 'bg-white text-bardia-rock/50 border-bardia-stone hover:text-bardia-rock'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Desnivel (+m)</span>
          </button>

          {/* Toggle Ritmo */}
          <button
            type="button"
            onClick={() => setShowPace(!showPace)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
              showPace
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-bardia-rock/50 border-bardia-stone hover:text-bardia-rock'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300"></span>
            <span>Ritmo (min/km)</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Gráfico Multimétrico */}
      <div className="h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: showElevation && showPace ? 65 : 30, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E0DE" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#172127"
              opacity={0.7}
              tick={{ fontSize: 11 }}
              tickLine={false}
              dy={10}
            />

            {/* Eje Y: Distancia (km) - Izquierda */}
            {showDistance && (
              <YAxis
                yAxisId="distance"
                orientation="left"
                stroke="#17324D"
                tick={{ fontSize: 11, fill: '#17324D' }}
                tickFormatter={(val) => `${val}k`}
                width={38}
                domain={[0, 'auto']}
              />
            )}

            {/* Eje Y: Desnivel (+m) - Derecha 1 */}
            {showElevation && (
              <YAxis
                yAxisId="elevation"
                orientation="right"
                stroke="#3E6653"
                tick={{ fontSize: 11, fill: '#3E6653' }}
                tickFormatter={(val) => `+${val}m`}
                width={48}
                domain={[0, 'auto']}
              />
            )}

            {/* Eje Y: Ritmo (min/km) - Derecha 2 con offset */}
            {showPace && (
              <YAxis
                yAxisId="pace"
                orientation="right"
                stroke="#D97706"
                tick={{ fontSize: 11, fill: '#D97706' }}
                tickFormatter={formatPaceTick}
                domain={paceDomain}
                width={45}
                offset={showElevation ? 45 : 0}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-xs font-semibold text-bardia-rock">{value}</span>
              )}
            />

            {/* Serie 1: Desnivel como Área Suave */}
            {showElevation && (
              <Area
                yAxisId="elevation"
                type="monotone"
                dataKey="elevationGainM"
                name="Desnivel (+m)"
                fill="#3E6653"
                fillOpacity={0.18}
                stroke="#3E6653"
                strokeWidth={2}
              />
            )}

            {/* Serie 2: Distancia como Barra Azul Cordillera */}
            {showDistance && (
              <Bar
                yAxisId="distance"
                dataKey="distanceKm"
                name="Distancia (km)"
                fill="#17324D"
                opacity={0.88}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            )}

            {/* Serie 3: Ritmo como Línea con Marcadores Ámbar */}
            {showPace && (
              <Line
                yAxisId="pace"
                type="monotone"
                dataKey="paceMinKm"
                name="Ritmo (min/km)"
                stroke="#D97706"
                strokeWidth={2.5}
                dot={{ fill: '#D97706', r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Nota técnica sobre los ejes múltiples */}
      <div className="flex items-center gap-1.5 text-[11px] text-bardia-rock/60 bg-bardia-snow/60 px-3 py-2 rounded border border-bardia-border">
        <Info className="w-3.5 h-3.5 text-bardia-cyan shrink-0" />
        <span>
          <strong>Lectura del gráfico:</strong> Las barras azules corresponden al eje izquierdo (Distancia en km); las áreas verdes representan el eje derecho (Desnivel en +m); la línea ámbar traza la velocidad de marcha/carrera (Ritmo en min/km). Podés encender o apagar métricas arriba.
        </span>
      </div>
    </div>
  );
}
