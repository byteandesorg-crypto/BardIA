import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jlxqybmesrrrsnzdewdt.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpseHF5Ym1lc3JycnNuemRld2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjY3MDIsImV4cCI6MjEwNTI0MjcwMn0.QCSe-EzC-8IjyKzWgRpUaCszr22jfCA14BChQvktZQk';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component
        }
      },
    },
  });
}
