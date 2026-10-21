/**
 * Centraliza la obtención segura de las variables de entorno de Supabase.
 * En tiempo de build en Vercel, provee valores de contingencia para permitir la
 * pre-renderización estática sin fallar, emitiendo advertencias claras si se ejecuta
 * en runtime de producción sin la configuración adecuada.
 */

const DEFAULT_SUPABASE_URL = 'https://jlxqybmesrrrsnzdewdt.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpseHF5Ym1lc3JycnNuemRld2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjY3MDIsImV4cCI6MjEwNTI0MjcwMn0.QCSe-EzC-8IjyKzWgRpUaCszr22jfCA14BChQvktZQk';

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) return url;

  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    console.warn(
      '[BARDIA] Advertencia: NEXT_PUBLIC_SUPABASE_URL no está definida en el entorno. Utilizando configuración por defecto.'
    );
  }

  return DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key) return key;

  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    console.warn(
      '[BARDIA] Advertencia: NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en el entorno. Utilizando configuración por defecto.'
    );
  }

  return DEFAULT_ANON_KEY;
}
