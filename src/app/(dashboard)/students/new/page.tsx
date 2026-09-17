'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ArrowLeft, User, Mountain, HeartPulse } from 'lucide-react';

export default function NewStudentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [idNumber, setIdNumber] = useState('');

  // Sports
  const [discipline, setDiscipline] = useState('Trail Running');
  const [level, setLevel] = useState('Intermedio');
  const [sportGoals, setSportGoals] = useState('');
  const [coachNotes, setCoachNotes] = useState('');

  // Emergency
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [medicalInsurance, setMedicalInsurance] = useState('');
  const [medicalInsuranceNumber, setMedicalInsuranceNumber] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Obtener la organización activa del usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No se encontró sesión activa.');

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (memberError || !memberData) {
        throw new Error('No se encontró una organización asociada a tu usuario.');
      }

      // 2. Insertar alumno
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          organization_id: memberData.organization_id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          id_number: idNumber.trim() || null,
          discipline,
          level,
          sport_goals: sportGoals.trim() || null,
          coach_notes: coachNotes.trim() || null,
          emergency_contact_name: emergencyContactName.trim() || null,
          emergency_contact_phone: emergencyContactPhone.trim() || null,
          emergency_contact_relation: emergencyContactRelation.trim() || null,
          medical_insurance: medicalInsurance.trim() || null,
          medical_insurance_number: medicalInsuranceNumber.trim() || null,
          emergency_notes: emergencyNotes.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/students/${newStudent.id}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al guardar el alumno.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/students">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bardia-blue">Alta de Alumno</h1>
          <p className="text-xs text-bardia-rock/60">
            Completá la información del deportista para integrarlo al seguimiento de tu equipo.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Datos Personales */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-bardia-blue" />
              <CardTitle>1. Datos Personales</CardTitle>
            </div>
            <CardDescription>Información de contacto e identificación básica</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              placeholder="Juan"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Apellido *"
              placeholder="Pérez"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="juan@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Teléfono / WhatsApp"
              placeholder="+54 9 299 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Fecha de Nacimiento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <Input
              label="DNI / Documento"
              placeholder="12345678"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* 2. Datos Deportivos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-bardia-cyan" />
              <CardTitle>2. Perfil Deportivo</CardTitle>
            </div>
            <CardDescription>Disciplina, nivel actual y objetivos del plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                  Disciplina Principal
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                >
                  <option value="Trail Running">Trail Running</option>
                  <option value="Running Calle">Running Calle</option>
                  <option value="Trekking / Montaña">Trekking / Montaña</option>
                  <option value="Ultra Trail">Ultra Trail</option>
                  <option value="Acondicionamiento Físico">Acondicionamiento Físico</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                  Nivel Deportivo
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="Inicial / Principiante">Inicial / Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado / Competitivo">Avanzado / Competitivo</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
            </div>

            <Input
              label="Objetivos Deportivos"
              placeholder="Ej. Completar 21k de montaña en Villa La Angostura, mejorar cadencia y resistencia."
              value={sportGoals}
              onChange={(e) => setSportGoals(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-bardia-rock uppercase tracking-wider">
                Observaciones Iniciales del Entrenador
              </label>
              <textarea
                rows={3}
                placeholder="Notas técnicas sobre antecedentes, historial de lesiones o puntos de partida."
                className="flex w-full rounded-md border border-bardia-border bg-white px-3 py-2 text-sm text-bardia-rock focus:border-bardia-cyan focus:outline-none focus:ring-2 focus:ring-bardia-cyan/20"
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Información de Emergencia */}
        <Card className="border-emerald-200/80 bg-white">
          <CardHeader className="bg-emerald-50/40">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-700" />
              <CardTitle className="text-emerald-900">3. Información de Emergencia</CardTitle>
            </div>
            <CardDescription>
              Datos prioritarios y de acceso rápido ante cualquier incidente en entrenamientos de campo o salidas a la barda/montaña.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
            <Input
              label="Contacto de Emergencia"
              placeholder="Nombre y Apellido"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
            <Input
              label="Teléfono de Emergencia"
              placeholder="+54 9 299 9876543"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
            />
            <Input
              label="Vínculo / Relación"
              placeholder="Ej. Cónyuge, Madre, Padre, Hermano/a"
              value={emergencyContactRelation}
              onChange={(e) => setEmergencyContactRelation(e.target.value)}
            />
            <Input
              label="Obra Social / Prepaga"
              placeholder="Ej. OSDE, Swiss Medical, ISSN"
              value={medicalInsurance}
              onChange={(e) => setMedicalInsurance(e.target.value)}
            />
            <Input
              label="Número de Afiliado"
              placeholder="12345678-01"
              value={medicalInsuranceNumber}
              onChange={(e) => setMedicalInsuranceNumber(e.target.value)}
            />
            <Input
              label="Notas Adicionales de Emergencia"
              placeholder="Alergias, grupo sanguíneo, medicación habitual..."
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/students">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="px-6">
            Guardar Alumno
          </Button>
        </div>
      </form>
    </div>
  );
}
