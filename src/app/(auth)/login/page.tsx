'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';
import { Mountain, ShieldCheck, Activity, BarChart2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push('/dashboard');
        router.refresh();
      } else {
        // Registro
        if (!orgName.trim()) {
          throw new Error('Por favor ingresá el nombre de tu equipo u organización.');
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (signUpError) throw signUpError;
        const user = signUpData.user;

        if (user) {
          // Crear organización inicial y membresía owner
          const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: orgName.trim(),
              slug,
            })
            .select()
            .single();

          if (!orgError && orgData) {
            await supabase.from('organization_members').insert({
              organization_id: orgData.id,
              user_id: user.id,
              role: 'owner',
            });
          }
        }

        setSuccess('¡Cuenta creada con éxito! Iniciando sesión...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al procesar la solicitud.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bardia-snow">
      {/* Columna Izquierda: Branding e Inspiración Neuquina */}
      <div className="md:w-1/2 bg-bardia-blue text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decoración gráfica de barda */}
        <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
          <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 400L150 220L300 290L450 140L600 400H0Z" fill="currentColor" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-bardia-cyan">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">BARDIA</h1>
              <p className="text-[10px] uppercase font-semibold text-bardia-cyan tracking-widest">
                Outdoor Performance + Data
              </p>
            </div>
          </div>
        </div>

        <div className="my-12 space-y-6 max-w-md">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Elevá la gestión de tus alumnos de running y montaña.
          </h2>
          <p className="text-sm text-bardia-stone leading-relaxed">
            Dejá atrás cuadernos, planillas dispersas y capturas de pantalla. Centralizá registros, analizá métricas cuantitativas y generá informes profesionales en segundos.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-bardia-stone">
              <Activity className="w-4 h-4 text-bardia-cyan" />
              <span>Control de Desnivel y Ritmo</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-bardia-stone">
              <BarChart2 className="w-4 h-4 text-bardia-cyan" />
              <span>Comparación de Períodos</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-bardia-stone">
              <ShieldCheck className="w-4 h-4 text-bardia-cyan" />
              <span>Documentos y Emergencia</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-bardia-stone">
              <Mountain className="w-4 h-4 text-bardia-cyan" />
              <span>Multi-Tenant Seguro</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-bardia-stone/60">
          © {new Date().getFullYear()} BARDIA. Inspirado en el paisaje neuquino. Desarrollado con Byte Andes.
        </div>
      </div>

      {/* Columna Derecha: Formulario Auth */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md shadow-md border-bardia-border">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <Logo />
            </div>
            <CardTitle className="text-xl font-bold text-bardia-blue">
              {mode === 'login' ? 'Iniciar Sesión en BARDIA' : 'Crear Cuenta de Entrenador'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Ingresá tus credenciales para acceder a tu plataforma'
                : 'Registrate para gestionar tu equipo y alumnos'}
            </CardDescription>

            {/* Toggle Login / Register */}
            <div className="flex bg-bardia-snow rounded-md p-1 mt-4 border border-bardia-border">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  mode === 'login'
                    ? 'bg-white text-bardia-blue shadow-sm'
                    : 'text-bardia-rock/60 hover:text-bardia-rock'
                }`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  mode === 'register'
                    ? 'bg-white text-bardia-blue shadow-sm'
                    : 'text-bardia-rock/60 hover:text-bardia-rock'
                }`}
              >
                Nuevo Registro
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Franco"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      label="Apellido"
                      placeholder="Giuliani"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Nombre de tu Organización / Equipo"
                    placeholder="Ej. Barda Trail Running Team"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    helperText="Podrás invitar a otros entrenadores luego."
                  />
                </>
              )}

              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="coach@bardia.app"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                {mode === 'login' ? 'Acceder a la Plataforma' : 'Crear Organización y Empezar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
