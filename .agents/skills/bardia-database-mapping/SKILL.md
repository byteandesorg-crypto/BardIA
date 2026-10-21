---
name: bardia-database-mapping
description: Inspeccionar, auditar y documentar el esquema PostgreSQL, relaciones, RPC, RLS y tipos TypeScript en BARDIA.
---

# BARDIA Database Mapping Skill

Esta skill guía la inspección rigurosa de la base de datos de BARDIA, la relación entre tablas, políticas de seguridad RLS, funciones RPC y su correspondencia exacta con `src/types/database.ts` y las consultas en el código.

## Cuándo usar esta skill
- Cuando se deba agregar o modificar un modelo de datos (alumnos, entrenamientos, métricas, documentos, organizaciones).
- Para auditar o agregar políticas RLS (Row Level Security) y funciones `SECURITY DEFINER`.
- Al encontrar inconsistencias entre los tipos TypeScript y los campos retornados por Supabase.
- Al preparar o revisar scripts SQL de migración antes de su aplicación.
- Para verificar el estado y los límites del proyecto de Supabase (por ejemplo, proyectos pausados o límites de nivel gratuito).

## Referencias arquitectónicas obligatorias
Antes de ejecutar cualquier cambio, consultar la documentación de referencia:
- [`docs/architecture/database-schema.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-schema.md): Catálogo exhaustivo de tablas, campos, nulabilidad, tipos e índices.
- [`docs/architecture/database-relations.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-relations.md): Diagrama ER en Mermaid, claves foráneas, reglas de borrado y mapeo de queries.
- [`docs/architecture/security-rls.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/security-rls.md): Políticas RLS por tabla y operación, funciones helper y pruebas negativas.

## Procedimiento paso a paso

### Paso 1: Identificar las entidades involucradas
El modelo multi-tenant de BARDIA contiene 7 tablas principales:
1. `organizations`: Tenant raíz (id, name, slug, logo_url, plan).
2. `organization_members`: Membresía y roles (organization_id, user_id, role).
3. `students`: Alumnos/atletas (organization_id, full_name, email, is_active, etc.).
4. `athlete_profiles`: Perfil deportivo 1:1 con student (vo2_max, max_hr, training_zones).
5. `workouts`: Entrenamientos realizados/planificados (student_id, organization_id, distance_km, duration_seconds, elevation_gain_m).
6. `student_documents`: Documentos médicos y certificados (student_id, organization_id, file_path, document_type).
7. `reports`: Informes editoriales A4 (student_id, organization_id, period_start, period_end, metrics_snapshot).

### Paso 2: Verificar la compatibilidad en `src/types/database.ts`
1. Toda columna nueva o modificada debe reflejarse en:
   - `Database['public']['Tables'][TableName]['Row']`
   - `Database['public']['Tables'][TableName]['Insert']`
   - `Database['public']['Tables'][TableName]['Update']`
2. Respetar tipos específicos:
   - Fechas: `string` (formato ISO 8601 o `YYYY-MM-DD`).
   - JSONB: `Record<string, unknown>` o interfaces estructuradas (como `ReportMetricsSnapshot`).
   - Identificadores: `string` (UUID v4).
   - Enums: tipados literales como `'owner' | 'coach' | 'admin'` o `'medical' | 'consent' | 'test' | 'other'`.

### Paso 3: Auditar las funciones RPC y Triggers
- BARDIA utiliza la función `create_organization_and_owner(org_name, org_slug)` con `SECURITY DEFINER` para permitir el registro atómico de una organización y la asignación del usuario como `owner` en `organization_members`.
- Al diseñar o modificar una función `SECURITY DEFINER`:
  - Definir siempre `SET search_path = public, auth`.
  - Validar que el invocador autenticado (`auth.uid()`) no pueda escalar privilegios sobre organizaciones ajenas.

### Paso 4: Validar la política RLS y aislamiento Multi-Tenant
1. RLS debe estar habilitado en **todas** las tablas (`ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;`).
2. Comprobar que las políticas de `SELECT`, `INSERT`, `UPDATE`, `DELETE` verifiquen la pertenencia a la organización:
   ```sql
   organization_id IN (SELECT get_my_org_ids())
   ```
3. En consultas de aplicación (Server Components y Client Components), aplicar **Defense-in-Depth**:
   ```typescript
   // Siempre incluir .eq('organization_id', orgId) explícitamente en el código
   const { data } = await supabase
     .from('workouts')
     .select('*')
     .eq('organization_id', orgId)
     .eq('student_id', studentId);
   ```

### Paso 5: Manejo de incertidumbres del esquema remoto
Si el proyecto de Supabase está inactivo o pausado (como en planes gratuitos tras 7 días sin uso):
- **NO asumir** cambios en la base de datos remota sin autorización.
- Documentar el estado inactivo del proyecto (consultar `mcp_supabase_get_project`).
- Mantener las migraciones preparadas en scripts SQL versionados.

## Verificación
1. Ejecutar `npx tsc --noEmit` para validar que todas las consultas de la aplicación coincidan con `src/types/database.ts`.
2. Ejecutar `npm run build` para asegurar que las páginas que acceden a Supabase compilen sin errores de tipado.
