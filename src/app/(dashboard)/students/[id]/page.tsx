import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  // Consultar alumno
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    notFound();
  }

  // Consultar entrenamientos
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('student_id', studentId)
    .order('workout_date', { ascending: false });

  // Consultar documentos
  const { data: documents } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  return (
    <StudentProfileView
      student={student}
      workouts={workouts || []}
      documents={documents || []}
    />
  );
}
