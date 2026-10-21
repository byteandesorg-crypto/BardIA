import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrInitUserOrganization } from '@/lib/supabase/get-org';
import { StudentProfileView } from './StudentProfileView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const studentId = parseInt(id, 10);

  if (isNaN(studentId)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { organizationId } = await getOrInitUserOrganization(supabase, user.id);

  // Consultar alumno asegurando pertenencia a la organización activa
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('organization_id', organizationId)
    .single();

  if (studentError || !student) {
    notFound();
  }

  // Consultar entrenamientos asegurando aislamiento
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('student_id', studentId)
    .eq('organization_id', organizationId)
    .order('workout_date', { ascending: false });

  // Consultar documentos asegurando aislamiento
  const { data: documents } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  return (
    <StudentProfileView
      student={student}
      workouts={workouts || []}
      documents={documents || []}
    />
  );
}
