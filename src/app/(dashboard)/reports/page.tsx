import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { Plus, FileText, ChevronRight, Download, Calendar } from 'lucide-react';

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from('reports')
    .select('*, student:students(id, first_name, last_name, discipline)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Informes Profesionales</h1>
          <p className="text-xs text-bardia-rock/60 mt-0.5">
            Generá reportes de rendimiento técnico en formato A4 para compartir con tus alumnos.
          </p>
        </div>

        <Link href="/reports/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Generar Nuevo Informe</span>
          </Button>
        </Link>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`} className="block group">
              <Card className="h-full transition-all group-hover:border-bardia-green group-hover:shadow-md">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-base font-bold text-bardia-blue group-hover:text-bardia-blue/90">
                          {report.title}
                        </h2>
                        <div className="text-xs text-bardia-rock/60 mt-0.5">
                          {report.student ? `${report.student.first_name} ${report.student.last_name}` : 'Alumno'}
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        A4 PDF
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-bardia-rock/70 border-t border-bardia-stoneLight pt-3">
                      <div className="flex items-center gap-1.5 text-bardia-rock/60">
                        <Calendar className="w-3.5 h-3.5 text-bardia-green" />
                        <span>
                          {formatDate(report.date_from)} — {formatDate(report.date_to)}
                        </span>
                      </div>
                      <div className="text-[11px] text-bardia-rock/50 mt-1">
                        Generado el {formatDate(report.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-bardia-stoneLight flex items-center justify-between text-xs font-semibold text-bardia-green">
                    <span>Ver informe completo</span>
                    <ChevronRight className="w-4 h-4 text-bardia-rock/40 group-hover:text-bardia-green group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Sin informes generados"
          description="Seleccioná un alumno y un rango de fechas para crear el primer informe editorial en PDF."
          actionLabel="Generar Primer Informe"
        />
      )}
    </div>
  );
}
