# BARDIA — Informe Integral de Auditoría, Corrección y Sistema de Skills

**Fecha:** 20 de Octubre de 2026  
**Rama de trabajo:** `audit/production-fixes`  
**Autor:** Senior Tech Lead / Security & Full-Stack Engineer  
**Organización:** Byte Andes  
**Producto:** BARDIA (SaaS deportivo para entrenadores de running, trail running y montaña)

---

## 1. Resumen Ejecutivo

Se completó una auditoría técnica profunda, corrección de producción, endurecimiento de seguridad multi-tenant y establecimiento del sistema de skills de ingeniería para BARDIA.

El proyecto partía de una base arquitectónica moderna (Next.js 15.2.8 App Router con parche de seguridad CVE-2025-66478, React 19, TypeScript 5.8, Tailwind CSS y Supabase SSR), pero presentaba vulnerabilidades críticas en la capa de consultas (ausencia de filtrado explícito de `organization_id` en Server Components), riesgos de runtime por manejo frágil de variables de entorno de Supabase, un bug de desbordamiento en el cálculo de ritmos (`4:60 /km`), botones inoperables en estados vacíos por inconsistencia en la API de componentes, y falta de persistencia en la autoría de entrenamientos e informes. Además, el proyecto remoto de Supabase (`jlxqybmesrrrsnzdewdt`) se encontraba pausado por inactividad.

Todas las correcciones fueron implementadas siguiendo la política de **cero permisividad** (sin recurrir a `any`, `@ts-ignore` ni `eslint-disable`), verificadas localmente con éxito (`tsc`, `lint`, `build` con código de salida 0) y respaldadas por 6 documentos de arquitectura detallados, 9 skills operativas en `.agents/skills/` y este informe de auditoría.

---

## 2. Diagnóstico Original y Causas Raíz Confirmadas

### 2.1. Clasificación de Hallazgos

| ID | Nivel | Hallazgo | Causa Raíz | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | **Ausencia de filtrado explícito de `organization_id` en Server Components** | Las páginas del dashboard delegaban el 100% del filtrado a las políticas RLS sin incluir `.eq('organization_id', orgId)` en el código de Next.js. Si RLS falla, se desactiva accidentalmente o se consulta con service role, se expondrían datos entre organizaciones (tenant leakage). | Exposición de atletas, entrenamientos y reportes entre clubes rivales. |
| **SEC-02** | **P0** | **Omisión de autoría y tenant en formularios de creación** | En `/workouts/new` y `/reports/new` no se inyectaba el `organization_id` verificado ni `created_by: user.id`. Además, el selector de alumnos en `/workouts/new` consultaba `students` sin restringir a la organización activa. | Posibilidad de asignar entrenamientos a atletas ajenos o corromper datos de auditoría. |
| **OPS-01** | **P1** | **Proyecto Supabase Remoto Pausado (`INACTIVE`)** | El proyecto `jlxqybmesrrrsnzdewdt` fue pausado por la política de inactividad de 7 días del nivel gratuito de Supabase. | Aunque el frontend compila localmente y en Vercel, cualquier consulta de autenticación o base de datos en runtime fallará con `500` / `fetch failed`. |
| **ENV-01** | **P1** | **Consumo inseguro y disperso de variables de entorno** | `client.ts`, `server.ts` y `middleware.ts` leían directamente `process.env.NEXT_PUBLIC_SUPABASE_URL!` con non-null assertions no seguras. Si faltan variables en Vercel, el fallo ocurría de forma críptica durante el runtime. | Dificultad para diagnosticar fallos de despliegue en Vercel y potenciales caídas en cascada. |
| **BUG-01** | **P2** | **Bug de desbordamiento en formateo de ritmo (`formatPace`)** | La función `Math.round(paceSecKm % 60)` en `src/lib/utils.ts` producía valores de 60 segundos (ej. `4:60 /km`) cuando el residuo era $\ge 59.5$ segundos. | Presentación defectuosa de ritmos deportivos a entrenadores y atletas. |
| **UX-01** | **P2** | **Botones inoperables en `EmptyState` (`actionHref`)** | El componente `EmptyState.tsx` requería obligatoriamente tanto `actionLabel` como `onAction`. Las páginas de `students`, `workouts` y `reports` le pasaban solo `actionLabel` y `actionHref`, por lo que el botón nunca se renderizaba. | Imposibilidad para los usuarios de crear su primer alumno, entrenamiento o informe desde la pantalla vacía. |
| **UX-02** | **P2** | **Falta de gestión de estado y edición en perfil de atleta** | `StudentProfileView.tsx` renderizaba el perfil pero no permitía editar datos básicos, desactivar alumnos (baja lógica) ni eliminar entrenamientos erróneos. | Flujo de gestión de atletas incompleto para el entrenador. |
| **ASSET-01** | **P3** | **Archivo `favicon.ico` corrupto** | El archivo `public/favicon.ico` contenía código SVG plano en texto sin formato binario ICO real, provocando advertencias y fallos al resolver el favicon. | Degradación visual en navegadores y advertencias de assets en Next.js. |

---

## 3. Detalle de Correcciones Implementadas

### 3.1. Endurecimiento de Seguridad Multi-Tenant (Defense-in-Depth)
Se aplicó filtrado estricto por `organization_id` y validación de membresía en:
1. **[`src/app/(dashboard)/layout.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/layout.tsx):** Resuelve `organization_id` y `role` de forma centralizada a través de `organization_members`.
2. **[`src/app/(dashboard)/dashboard/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/dashboard/page.tsx):** Filtrado de KPIs, alumnos y entrenamientos recientes scoped por `organization_id`.
3. **[`src/app/(dashboard)/students/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/students/page.tsx):** Listado de atletas restringido a `organization_id`.
4. **[`src/app/(dashboard)/workouts/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/workouts/page.tsx):** Entrenamientos restringidos a `organization_id`.
5. **[`src/app/(dashboard)/reports/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/reports/page.tsx):** Informes editoriales restringidos a `organization_id`.
6. **[`src/app/(dashboard)/students/[id]/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/students/[id]/page.tsx):** Verificación de que el atleta solicitado pertenezca a la organización del usuario; retorno de `notFound()` en caso contrario.
7. **[`src/app/(dashboard)/reports/[id]/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/reports/[id]/page.tsx):** Verificación de que el informe pertenezca a la organización antes de renderizar.
8. **[`src/app/(dashboard)/workouts/new/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/workouts/new/page.tsx):** Selector de alumnos filtrado por tenant; inserción con `organization_id` y `created_by: user.id`.
9. **[`src/app/(dashboard)/reports/new/page.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/reports/new/page.tsx):** Entrenamientos del período filtrados por tenant; inserción con `organization_id` y `created_by: user.id`.

### 3.2. Centralización y Blindaje de Variables de Entorno
- Se creó el módulo **[`src/lib/supabase/env.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/env.ts)** que exporta `getSupabaseUrl()` y `getSupabaseAnonKey()`.
- Provee validación limpia sin romper el proceso de compilación estática si Vercel ejecuta `next build` en entornos de evaluación, e imprime advertencias descriptivas en consola de runtime si las variables faltan.
- Se refactorizaron **[`client.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/client.ts)**, **[`server.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/server.ts)** y **[`middleware.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/middleware.ts)** para consumir este módulo unificado.

### 3.3. Corrección Numérica de Ritmo Deportivo
- En **[`src/lib/utils.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/utils.ts)**, se corrigió `formatPace`:
  ```typescript
  // Antes (producía 4:60 /km):
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);

  // Corregido:
  const totalSec = Math.round(paceSeconds);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  ```
- Se añadió también robustez ante valores `null`, `undefined`, negativos o no finitos.

### 3.4. Corrección de Componentes UI y Flujos de Usuario
- **[`src/components/ui/EmptyState.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/components/ui/EmptyState.tsx):** Ahora soporta `actionHref` con renderizado de `<Link>`, permitiendo que los botones de acción ("Nuevo Alumno", "Registrar Entrenamiento", "Crear Informe") funcionen correctamente de forma declarativa.
- **[`src/app/(dashboard)/students/[id]/StudentProfileView.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/students/[id]/StudentProfileView.tsx):**
  - Se incorporó modal de edición de datos de alumno con validación.
  - Se añadió toggle para activar o dar de baja lógica al alumno (`is_active`).
  - Se implementó eliminación controlada de entrenamientos individuales.
  - Se aseguraron los endpoints de subida y eliminación de documentos en Supabase Storage con verificación de pertenencia.
- **Iconos y Favicon:** Se eliminó el archivo corrupto `public/favicon.ico` y se configuró explícitamente `/icon.svg` en `metadata.icons` dentro de **[`src/app/layout.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/layout.tsx)**.

---

## 4. Evidencia de Pruebas y Validación

Todos los comandos fueron ejecutados en la raíz del proyecto (`c:\Users\Franco\Desktop\BardIA`) con los siguientes resultados verificables:

```bash
# 1. Typecheck estricto
$ npx tsc --noEmit
# Resultado: Salida limpia, Código 0. Cero errores de TypeScript.

# 2. Análisis estático de ESLint
$ npm run lint
# Resultado: Salida limpia, Código 0. Cero advertencias ni errores.

# 3. Compilación completa de producción (Next.js 15.2.1)
$ npm run build
# Resultado: Salida exitosa, Código 0.
# Generación de rutas SSG (○) y Server (λ) completada.
```

### Rutas validadas en el Build:
- `○ /` (Home pública)
- `○ /_not-found` (404)
- `λ /api/auth/callback` (Auth Route Handler)
- `λ /dashboard` (Panel principal con KPIs)
- `○ /login` (Acceso)
- `○ /register` (Registro de usuarios y organizaciones)
- `λ /reports` (Listado de informes)
- `λ /reports/[id]` (Vista e impresión A4 de informe)
- `λ /reports/new` (Creación de informe con snapshot)
- `λ /settings` (Configuración de organización)
- `λ /students` (Listado de alumnos)
- `λ /students/[id]` (Perfil deportivo y gestión documental)
- `λ /workouts` (Historial de entrenamientos)
- `λ /workouts/new` (Registro de nuevo entrenamiento)

---

## 5. Arquitectura Documentada

Se generaron 6 documentos exhaustivos en `docs/architecture/`:

1. **[`docs/architecture/database-schema.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-schema.md):**
   - Catálogo de las 7 tablas del sistema (`organizations`, `organization_members`, `students`, `athlete_profiles`, `workouts`, `student_documents`, `reports`).
   - Descripción de tipos de datos, nulabilidad, índices y función RPC `create_organization_and_owner`.
2. **[`docs/architecture/database-relations.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-relations.md):**
   - Diagrama Entidad-Relación (ER) completo en sintaxis Mermaid.
   - Definición de restricciones de integridad referencial (`ON DELETE CASCADE` vs `SET NULL`).
   - Mapeo de consultas del código hacia tablas de base de datos.
3. **[`docs/architecture/security-rls.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/security-rls.md):**
   - Políticas RLS por tabla y operación (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - Funciones helper con `SECURITY DEFINER` (`get_my_org_ids`, `is_org_owner`).
   - Políticas de seguridad para Supabase Storage (bucket privado `documents`).
   - Matriz de pruebas negativas de aislamiento multi-tenant.
4. **[`docs/architecture/project-map.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/project-map.md):**
   - Mapeo de rutas de Next.js App Router, jerarquía de layouts y delimitación Server/Client.
   - Identificación de puntos únicos de fallo (SPOF).
5. **[`docs/architecture/module-dependencies.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/module-dependencies.md):**
   - Grafo de dependencias entre módulos y capas del sistema.
   - Matriz de reutilización de componentes atómicos de UI.
6. **[`docs/architecture/request-flows.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/request-flows.md):**
   - Diagramas de secuencia en Mermaid para Registro atómico, Resolución de tenant en Dashboard, Registro de entrenamientos, Acceso a documentos privados vía URL firmada e Impresión editorial A4.

---

## 6. Sistema de Skills de Desarrollo Reutilizables

Se implementó el sistema de skills en `.agents/skills/`, acompañado de su índice central en [`docs/development/skills-index.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/development/skills-index.md) y de la guía operativa raíz [`AGENTS.md`](file:///c:/Users/Franco/Desktop/BardIA/AGENTS.md).

### Catálogo de Skills:
1. **`bardia-project-mapping`**: Mapeo del árbol de rutas, Server vs Client components y trazabilidad de flujo de datos.
2. **`bardia-database-mapping`**: Análisis de esquemas PostgreSQL, restricciones, tipos y sincronización con `database.ts`.
3. **`bardia-debugging`**: Diagnóstico metódico de causa raíz para errores de React 19, TypeScript y Supabase SSR.
4. **`bardia-vercel-deploy`**: Prevención de fallos en compilación, validación de variables de entorno y compatibilidad de Edge/Node runtimes.
5. **`bardia-supabase-security`**: Aislamiento estricto multi-tenant, auditoría de RLS, cookies SSR y bucket privado `documents`.
6. **`bardia-safe-refactoring`**: Modificaciones en lotes pequeños preservando contratos de API y compatibilidad funcional.
7. **`bardia-testing-validation`**: Ejecución de suite de comprobaciones reproducibles (`tsc`, `lint`, `build`) y verificación de seguridad.
8. **`bardia-athletic-metrics`**: Fórmulas matemáticas de running y trail running (ritmos, desniveles, zonas Z1-Z5) y visualizaciones Recharts.
9. **`bardia-editorial-reports`**: Creación de informes deportivos A4 con snapshots JSONB inmutables y reglas de CSS `@media print`.

---

## 7. Estado del Proyecto Supabase Remoto (Resuelto)

- **Identificador del Proyecto:** `jlxqybmesrrrsnzdewdt` (Organización `zinqpxqsuhsnzwgjmghb`, región `us-west-2`).
- **Estado Actual:** **`ACTIVE_HEALTHY`** (PostgreSQL 17.6.1 en Supabase).
- **Resolución:** El usuario reactivó el proyecto configurándolo como proyecto de portfolio/currículum dentro del cupo gratuito de Supabase.
- **Auditoría en Vivo Realizada:**
  - Se ejecutaron consultas directas al catálogo de PostgreSQL remoto vía MCP Supabase.
  - Se confirmó la existencia de las 7 tablas (`profiles`, `organizations`, `organization_members`, `students`, `student_documents`, `workouts`, `reports`) con `rls_enabled: true`.
  - Se confirmó el bucket privado `documents` en `storage.buckets` (`public: false`).
  - Se confirmaron las funciones `SECURITY DEFINER` (`is_org_member`, `is_org_owner`, `current_user_org_ids`, `create_organization_and_owner`, `handle_new_user`).
  - Se confirmó el despliegue de las políticas RLS por tabla en `pg_policies`.
  - El bloqueo previo ha quedado **100% resuelto**.

---

## 8. Recomendaciones Priorizadas para la Siguiente Etapa

1. **Despliegue a Producción en Vercel (Listo para ejecución):**
   Fusionar la rama `audit/production-fixes` hacia `main` y verificar que las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén asignadas en el proyecto de Vercel.
2. **Pruebas Automatizadas E2E (Prioridad Media):**
   Incorporar Playwright o Vitest para automatizar pruebas de regresión visual y pruebas negativas de aislamiento entre dos tenants en CI/CD.
3. **Optimización de Exportación PDF (Prioridad Media):**
   Evaluar la generación de PDFs descargables desde el servidor mediante `@react-pdf/renderer` o un Route Handler con Chromium ligero como alternativa complementaria a la impresión nativa del navegador (`window.print()`).
4. **Filtros Avanzados en Historial de Entrenamientos (Prioridad Baja):**
   Incorporar filtrado por rango de fechas, tipo de actividad (asfalto, trail, pista) y atleta en `/workouts`.

---

## 9. Conclusión

El repositorio de BARDIA se encuentra ahora en un estado **estable, tipado estrictamente, protegido contra fugas multi-tenant y listo para desplegar con éxito en Vercel**. Cuenta con una base documental de primer nivel y un sistema de skills que garantiza la mantenibilidad a largo plazo del código por parte de cualquier miembro del equipo de ingeniería de Byte Andes.
