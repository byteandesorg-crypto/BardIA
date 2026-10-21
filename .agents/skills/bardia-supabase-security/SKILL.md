---
name: bardia-supabase-security
description: Garantizar autenticación SSR, autorización estricta multi-tenant, políticas RLS y protección de archivos privados en BARDIA.
---

# BARDIA Supabase Security Skill

Esta skill enseña cómo mantener la seguridad integral, el aislamiento multi-tenant y la protección de datos médicos y personales en BARDIA, utilizando Supabase Auth, PostgreSQL RLS y Supabase Storage.

## Cuándo usar esta skill
- Al crear una nueva consulta o mutación en la base de datos.
- Al manipular documentos de alumnos o subidas a Supabase Storage (`documents` bucket).
- Al implementar nuevas Server Actions, API Routes o Server Components.
- Para auditar y prevenir filtraciones de datos entre organizaciones deportivas (tenant leakage).
- Al revisar políticas de autenticación y sesiones SSR.

## Principios de seguridad no negociables en BARDIA
1. **Aislamiento Multi-Tenant Absoluto:** Ningún usuario de la Organización A debe poder leer, crear, modificar o eliminar registros de la Organización B.
2. **Defensa en Profundidad (Defense-in-Depth):**
   - Nivel 1 (Base de Datos): Row Level Security (RLS) habilitado en el 100% de las tablas.
   - Nivel 2 (Servidor): Filtrar explícitamente por `.eq('organization_id', orgId)` en todas las consultas de la aplicación.
3. **Bucket Privado para Documentación:** El bucket `documents` nunca es público. El acceso se realiza exclusivamente mediante URLs firmadas temporales (`createSignedUrl`).
4. **Clientes Supabase Claramente Separados:**
   - [`src/lib/supabase/client.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/client.ts): Exclusivo para Client Components (`createBrowserClient`).
   - [`src/lib/supabase/server.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/server.ts): Exclusivo para Server Components, Server Actions y Route Handlers (`createServerClient` con cookies asíncronas).
   - [`src/lib/supabase/middleware.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/middleware.ts): Exclusivo para el middleware de actualización de sesión.

## Guía de implementación segura

### 1. Validación de pertenencia a la organización en Server Components
Siempre validar la pertenencia antes de consultar recursos:
```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Obtener membresía activa
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  // Consulta con filtro explícito de tenant
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('organization_id', membership.organization_id);

  return <WorkoutsList workouts={workouts} />;
}
```

### 2. Mutaciones con asignación de autoría
Al insertar registros en `workouts`, `reports`, `students` o `student_documents`:
- Asignar siempre `organization_id: membership.organization_id`.
- Asignar siempre `created_by: user.id` cuando el campo exista.
- Nunca confiar en un `organization_id` enviado ciegamente desde el cliente sin verificar que el usuario pertenece a dicha organización.

### 3. Manejo seguro de Storage (`documents` bucket)
- **Ruta del archivo en Storage:** Estructurar por tenant y student para trazabilidad y aislamiento:
  `organizations/{orgId}/students/{studentId}/{timestamp}_{filename}`
- **Descarga segura:** No generar links estáticos. Generar URLs firmadas con expiración corta (ej. 300 segundos):
  ```typescript
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 300); // 5 minutos de validez
  ```
- **Políticas de Storage:** Consultar [`docs/architecture/security-rls.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/security-rls.md) para verificar que las políticas de storage verifiquen la pertenencia a la organización.

### 4. Reglas para funciones `SECURITY DEFINER`
- Toda función con `SECURITY DEFINER` (como `create_organization_and_owner`) ejecuta con privilegios elevados:
  - Debe definir explícitamente `SET search_path = public, auth`.
  - Solo debe utilizarse para operaciones atómicas de registro inicial que no pueden resolverse con RLS estándar.
  - No exponer parámetros que permitan modificar organizaciones arbitrarias.

## Lista de verificación de seguridad
- [ ] ¿Todas las tablas tienen RLS habilitado?
- [ ] ¿Las consultas del servidor incluyen `.eq('organization_id', orgId)`?
- [ ] ¿Los Client Components evitan usar `SUPABASE_SERVICE_ROLE_KEY`?
- [ ] ¿Las variables de entorno se obtienen mediante `src/lib/supabase/env.ts`?
- [ ] ¿Los documentos médicos solo se acceden mediante URLs firmadas?
- [ ] ¿Las pruebas de compilación y tipos pasan sin omisiones de seguridad?
