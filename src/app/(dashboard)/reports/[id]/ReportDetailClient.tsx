'use client';

import React from 'react';
import Link from 'next/link';
import { Report, Student, Workout } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatPace, formatDuration, formatDate } from '@/lib/utils';
import { ArrowLeft, Printer, Download, Mountain, Activity, TrendingUp, Calendar, Heart } from 'lucide-react';

interface ReportDetailClientProps {
  report: Report & { student?: Student };
  orgName: string;
}

export function ReportDetailClient({ report, orgName }: ReportDetailClientProps) {
  const { student, metrics_snapshot } = report;
  const workoutsList = (metrics_snapshot?.workouts_list as Workout[]) || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Barra de Acciones (No imprimible) */}
      <div className="flex items-center justify-between no-print">
        <Link href="/reports">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Informes</span>
          </Button>
        </Link>

        <Button onClick={handlePrint} size="sm" className="gap-2 bg-bardia-green hover:bg-bardia-green/90">
          <Printer className="w-4 h-4" />
          <span>Descargar / Imprimir PDF (A4)</span>
        </Button>
      </div>

      {/* DOCUMENTO A4 PARA VISUALIZACIÓN E IMPRESIÓN */}
      <div className="bg-white rounded-lg border border-bardia-border p-8 md:p-12 shadow-sm text-bardia-rock print:border-0 print:shadow-none print:p-0 print:m-0">
        {/* Encabezado Editorial A4 */}
        <div className="flex items-start justify-between border-b-2 border-bardia-blue pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-bardia-blue font-bold text-xl tracking-wider">
              <div className="w-7 h-7 rounded bg-bardia-blue text-bardia-cyan flex items-center justify-center">
                <Mountain className="w-4 h-4" />
              </div>
              <span>BARDIA</span>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-bardia-rock/50 mt-1">
              {orgName} • Informe de Rendimiento Deportivo
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-bardia-blue text-sm">INFORME TÉCNICO</div>
            <div className="text-bardia-rock/60 mt-0.5">Emisión: {formatDate(report.created_at)}</div>
            <div className="text-bardia-green font-semibold mt-0.5">
              Período: {formatDate(report.date_from)} al {formatDate(report.date_to)}
            </div>
          </div>
        </div>

        {/* Datos del Atleta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-md bg-bardia-snow border border-bardia-stoneLight mb-8 text-xs">
          <div>
            <span className="text-bardia-rock/50 block text-[10px] uppercase font-bold">Atleta</span>
            <span className="font-bold text-sm text-bardia-blue">
              {student ? `${student.last_name}, ${student.first_name}` : 'Alumno'}
            </span>
          </div>
          <div>
            <span className="text-bardia-rock/50 block text-[10px] uppercase font-bold">Disciplina</span>
            <span className="font-semibold">{student?.discipline || 'Trail Running'}</span>
          </div>
          <div>
            <span className="text-bardia-rock/50 block text-[10px] uppercase font-bold">Nivel</span>
            <span className="font-semibold">{student?.level || 'Intermedio'}</span>
          </div>
          <div>
            <span className="text-bardia-rock/50 block text-[10px] uppercase font-bold">Sesiones Evaluadas</span>
            <span className="font-bold text-bardia-blue">{metrics_snapshot?.total_workouts || 0} entrenamientos</span>
          </div>
        </div>

        {/* Resumen Métrico Cuantitativo */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-bardia-blue mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-bardia-cyan" />
            <span>Métricas Clave del Período</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded border border-bardia-stoneLight text-center">
              <span className="text-[11px] text-bardia-rock/60 uppercase font-semibold block">Distancia Total</span>
              <span className="text-2xl font-bold text-bardia-blue">{metrics_snapshot?.total_distance_km || 0}</span>
              <span className="text-xs text-bardia-rock/50 ml-1">km</span>
            </div>

            <div className="p-4 rounded border border-bardia-stoneLight text-center">
              <span className="text-[11px] text-bardia-rock/60 uppercase font-semibold block">Desnivel Acumulado</span>
              <span className="text-2xl font-bold text-bardia-green">
                +{metrics_snapshot?.total_elevation_m?.toLocaleString('es-AR') || 0}
              </span>
              <span className="text-xs text-bardia-rock/50 ml-1">m</span>
            </div>

            <div className="p-4 rounded border border-bardia-stoneLight text-center">
              <span className="text-[11px] text-bardia-rock/60 uppercase font-semibold block">Tiempo Total</span>
              <span className="text-2xl font-bold text-bardia-blue">
                {formatDuration(metrics_snapshot?.total_duration_seconds)}
              </span>
            </div>

            <div className="p-4 rounded border border-bardia-stoneLight text-center">
              <span className="text-[11px] text-bardia-rock/60 uppercase font-semibold block">Ritmo Medio</span>
              <span className="text-2xl font-bold text-bardia-blue">
                {formatPace(metrics_snapshot?.avg_pace_sec_km)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Entrenamientos del Período */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-bardia-blue mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-bardia-cyan" />
            <span>Desglose de Sesiones Realizadas</span>
          </h3>

          {workoutsList.length > 0 ? (
            <div className="border border-bardia-stoneLight rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-bardia-snow text-bardia-rock/70 uppercase text-[9px] tracking-wider border-b border-bardia-stoneLight">
                  <tr>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Sesión</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Distancia</th>
                    <th className="p-2.5">Tiempo</th>
                    <th className="p-2.5">Ritmo</th>
                    <th className="p-2.5">Desnivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bardia-stoneLight">
                  {workoutsList.map((w) => (
                    <tr key={w.id}>
                      <td className="p-2.5 font-semibold text-bardia-blue whitespace-nowrap">
                        {formatDate(w.workout_date)}
                      </td>
                      <td className="p-2.5 font-medium">{w.title}</td>
                      <td className="p-2.5 text-bardia-rock/60">{w.workout_type}</td>
                      <td className="p-2.5 font-bold text-bardia-blue">{w.distance_km ? `${w.distance_km} km` : '-'}</td>
                      <td className="p-2.5">{formatDuration(w.duration_seconds)}</td>
                      <td className="p-2.5">{formatPace(w.average_pace_sec_km)}</td>
                      <td className="p-2.5 font-semibold text-bardia-green">
                        {w.elevation_gain_m ? `+${w.elevation_gain_m}m` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-bardia-rock/50 italic">No se registraron entrenamientos en este rango de fechas.</p>
          )}
        </div>

        {/* Devolución Técnica del Entrenador */}
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-bardia-blue mb-3">
            Devolución y Conclusiones Técnicas del Entrenador
          </h3>
          <div className="p-5 rounded bg-bardia-snow border border-bardia-stone text-xs leading-relaxed text-bardia-rock/80 whitespace-pre-wrap">
            {report.coach_summary || 'Sin observaciones adicionales registradas para este informe.'}
          </div>
        </div>

        {/* Footer Editorial A4 */}
        <div className="pt-6 border-t border-bardia-stoneLight flex items-center justify-between text-[11px] text-bardia-rock/50">
          <div>Plataforma BARDIA — Outdoor Performance + Data</div>
          <div>Documento de rendimiento deportivo emitido por {orgName}</div>
        </div>
      </div>
    </div>
  );
}
