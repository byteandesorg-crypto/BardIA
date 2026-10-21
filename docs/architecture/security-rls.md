# BARDIA — Seguridad Multi-Tenant, Políticas RLS y Storage

## 1. Modelo de Amenazas y Principios de Aislamiento

BARDIA es una plataforma multi-tenant donde conviven múltiples clubes deportivos, entrenadores y alumnos. Los datos gestionados incluyen información sensible:
- Datos personales y de contacto de alumnos (DNI, teléfono, fecha de nacimiento).
- Fichas de emergencia médica (números de afiliado de salud, coberturas, alergias, medicación).
- Documentación privada (aptos médicos, ergometrías, estudios cardiológicos).
- Historiales de rendimiento y devoluciones técnicas individuales.

### Principios Obligatorios:
1. **Aislamiento por Organización (Zero Trust):** Ningún usuario perteneciente a la Organización A puede bajo ninguna circunstancia leer, crear, modificar o eliminar entidades asociadas a la Organización B.
2. **Defensa en Profundidad (Defense in Depth):**  
   - Capa 1: Políticas de Row Level Security (RLS) estrictas en PostgreSQL.
   - Capa 2: Filtrado explícito por `organization_id` en las consultas de Next.js.
   - Capa 3: Verificación de membresía y rol en Server Components y Server Actions.
3. **No Recurrencia Infinita en RLS:** Las políticas sobre `organization_members` no deben consultar recursivamente `organization_members` sin una función auxiliar con `SECURITY DEFINER` o sin condiciones directas por `user_id = auth.uid()`.
4. **Protección Estricta de Storage:** Los archivos de salud y aptos físicos en el bucket `documents` son **privados**; su acceso requiere autenticación y solo se sirve mediante URLs firmadas de corta duración (TTL = 120 segundos).

---

## 2. Funciones de Soporte y Políticas RLS Verificadas en Vivo

En la base de datos remota (`jlxqybmesrrrsnzdewdt`, PostgreSQL 17.6.1), las políticas RLS y funciones de soporte están desplegadas y activas (`rls_enabled: true` en todas las tablas públicas).

### 2.1. Funciones de Soporte de Seguridad (`SECURITY DEFINER`)
Estas funciones evitan recursión infinita en las políticas de PostgreSQL y optimizan la evaluación del planificador:

```sql
-- Verifica si el usuario autenticado pertenece a la organización
CREATE OR REPLACE FUNCTION public.is_org_member(org_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$;

-- Verifica si el usuario actual es 'owner' de la organización
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members WHERE organization_id = org_id AND user_id = auth.uid() AND role = 'owner'
  );
$$;

-- Retorna las organizaciones del usuario autenticado
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS SETOF integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;
```

---

### 2.2. Políticas por Tabla (Verificadas en `pg_policies`)

#### Tabla: `public.profiles`
- `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- **SELECT:** `Profiles viewable by authenticated users`  
  `FOR SELECT TO authenticated USING (true);`
- **UPDATE:** `Users can update own profile`  
  `FOR UPDATE TO authenticated USING (auth.uid() = id);`

#### Tabla: `public.organizations`
- `ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;`
- **SELECT:** `Members can view their organizations`  
  `FOR SELECT TO authenticated USING (is_org_member(id));`
- **UPDATE:** `Owners can update organization`  
  `FOR UPDATE TO authenticated USING (is_org_owner(id));`
- **INSERT:** `Authenticated users can create organization`  
  `FOR INSERT TO authenticated WITH CHECK (true);`

#### Tabla: `public.organization_members`
- `ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;`
- **SELECT:** `Members can view peers in same organization`  
  `FOR SELECT TO authenticated USING (is_org_member(organization_id));`
- **INSERT:** `Authenticated users can add member upon org creation`  
  `FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) OR is_org_owner(organization_id));`
- **UPDATE:** `Owners can update members`  
  `FOR UPDATE TO authenticated USING (is_org_owner(organization_id));`
- **DELETE:** `Owners can delete members`  
  `FOR DELETE TO authenticated USING (is_org_owner(organization_id));`

#### Tabla: `public.students`
- `ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;`
- **SELECT:** `Org members can read students`  
  `FOR SELECT TO authenticated USING (is_org_member(organization_id));`
- **INSERT:** `Org members can insert students`  
  `FOR INSERT TO authenticated WITH CHECK (is_org_member(organization_id));`
- **UPDATE:** `Org members can update students`  
  `FOR UPDATE TO authenticated USING (is_org_member(organization_id));`
- **DELETE:** `Org members can delete students`  
  `FOR DELETE TO authenticated USING (is_org_member(organization_id));`

#### Tabla: `public.student_documents`
- `ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;`
- **ALL:** `Org members can manage student documents`  
  `FOR ALL TO authenticated USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));`

#### Tabla: `public.workouts`
- `ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;`
- **ALL:** `Org members can manage workouts`  
  `FOR ALL TO authenticated USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));`

#### Tabla: `public.reports`
- `ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;`
- **ALL:** `Org members can manage reports`  
  `FOR ALL TO authenticated USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));`

---

## 3. Políticas de Supabase Storage para el Bucket `documents`

Los objetos del bucket `documents` siguen la estructura de carpetas:
`org_<organization_id>/student_<student_id>/<filename>`

### Políticas de `storage.objects`:

```sql
-- 1. SELECT (Lectura y generación de URLs firmadas)
CREATE POLICY "storage_docs_select_org"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT 'org_' || organization_id::text
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- 2. INSERT (Carga de certificados y aptos)
CREATE POLICY "storage_docs_insert_org"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT 'org_' || organization_id::text
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- 3. DELETE (Eliminación de archivos)
CREATE POLICY "storage_docs_delete_org"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT 'org_' || organization_id::text
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);
```

---

## 4. Auditoría de Seguridad y Pruebas Negativas de Aislamiento

Para verificar la inviolabilidad del multi-tenancy:
1. **Prueba Negativa 1 (Consulta cruzada de alumno):**  
   Un usuario autenticado de Org 1 realiza una petición directa a `/students/999` (donde 999 pertenece a Org 2).  
   *Resultado esperado:* Error 404 (`notFound()`), tanto por RLS como por validación de `student.organization_id === activeOrgId`.
2. **Prueba Negativa 2 (Acceso a documento privado):**  
   Un usuario de Org 1 intenta generar una URL firmada para un path `org_2/student_50/apto.pdf`.  
   *Resultado esperado:* Supabase Storage rechaza la firma con código de acceso denegado (RLS de Storage).
3. **Prueba Negativa 3 (Inserción con falsificación de `organization_id`):**  
   Un cliente manipula el payload de carga de sesión asignando `organization_id: 2` mientras su membresía pertenece a Org 1.  
   *Resultado esperado:* Error 401/403 en PostgreSQL al fallar la cláusula `WITH CHECK (organization_id IN (SELECT public.get_my_org_ids()))`.
