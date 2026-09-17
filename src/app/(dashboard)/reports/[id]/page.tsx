import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReportDetailClient } from './ReportDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const reportId = parseInt(id, 10);

  if (isNaN(reportId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from('reports')
    .select('*, student:students(*), organization:organizations(name)')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    notFound();
  }

  const orgName = (report.organization as { name?: string })?.name || 'Estudio de Entrenamiento';

  return <ReportDetailClient report={report} orgName={orgName} />;
}
