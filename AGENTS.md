# BARDIA — Operational Guidelines & Agent Instructions

Bienvenido al repositorio de **BARDIA**, una plataforma SaaS para entrenadores de running, trail running y deportes de montaña desarrollada por Byte Andes.

Este archivo define las reglas obligatorias de ingeniería, el sistema de skills y los estándares técnicos que cualquier agente o desarrollador debe respetar en este proyecto.

---

## 1. Stack Tecnológico

- **Framework:** Next.js 15.2.8 (App Router).
- **Librería UI:** React 19.
- **Tipado:** TypeScript 5.8 (Modo Estricto).
- **Estilos:** Tailwind CSS 3.4 con Vanilla CSS para optimizaciones de impresión editorial.
- **Backend & Auth:** Supabase con soporte SSR mediante `@supabase/ssr`.
- **Base de Datos:** PostgreSQL con Row Level Security (RLS) multi-tenant.
- **Visualización:** Recharts.
- **Almacenamiento:** Supabase Storage (Bucket privado `documents`).
- **Despliegue:** Vercel.

---

## 2. Reglas Obligatorias de Desarrollo

1. **Cero Tolerancia a Permisividad:** Prohibido usar `any`, `@ts-ignore`, `eslint-disable` o banderas permisivas para silenciar errores. Si hay un problema de tipos, resolver la causa raíz en `src/types/database.ts` o en los datos.
2. **Aislamiento Multi-Tenant (Defense-in-Depth):**
   - Todas las consultas en Server Components y Client Components deben incluir explícitamente `.eq('organization_id', orgId)`.
   - No delegar la seguridad únicamente a RLS en la base de datos; aplicar validación en capas.
3. **Preservación de Entorno Seguro:** Consumir siempre las variables de entorno de Supabase mediante [`src/lib/supabase/env.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/env.ts). Nunca exponer secretos ni la clave `SUPABASE_SERVICE_ROLE_KEY` en el cliente.
4. **Almacenamiento Privado:** El bucket `documents` nunca es público. Todos los accesos se realizan mediante URLs firmadas de corta duración.
5. **Snapshots Históricos en Informes:** Los informes editoriales deben calcular sus métricas al crearse y guardarlas en `metrics_snapshot` (JSONB) para garantizar inmutabilidad histórica.
6. **Validación Obligatoria:** Ningún cambio se da por finalizado sin que `npx tsc --noEmit`, `npm run lint` y `npm run build` terminen con código 0.

---

## 3. Sistema de Skills de Desarrollo

BARDIA cuenta con un sistema de skills estandarizadas en [`.agents/skills/`](file:///c:/Users/Franco/Desktop/BardIA/.agents/skills/). Consultar el catálogo completo en [`docs/development/skills-index.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/development/skills-index.md).

### Resumen de Skills
1. **`bardia-project-mapping`**: Navegación y límites Server/Client.
2. **`bardia-database-mapping`**: Esquema PostgreSQL, relaciones y tipos.
3. **`bardia-debugging`**: Diagnóstico de causa raíz sin especulaciones.
4. **`bardia-vercel-deploy`**: Prevención y resolución de fallos de despliegue.
5. **`bardia-supabase-security`**: SSR, Auth, RLS y protección de archivos.
6. **`bardia-safe-refactoring`**: Modificaciones controladas sin romper contratos.
7. **`bardia-testing-validation`**: Ejecución de suite de comprobaciones y registro de evidencia.
8. **`bardia-athletic-metrics`**: Fórmulas deportivas, redondeo de ritmos y gráficos.
9. **`bardia-editorial-reports`**: Informes A4, diseño editorial y reglas de impresión.

---

## 4. Fuentes de Verdad Arquitectónicas

- **Esquema de Base de Datos:** [`docs/architecture/database-schema.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-schema.md)
- **Relaciones entre Tablas y Diagrama ER:** [`docs/architecture/database-relations.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-relations.md)
- **Seguridad RLS y Pruebas Negativas:** [`docs/architecture/security-rls.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/security-rls.md)
- **Mapa de Rutas y Componentes:** [`docs/architecture/project-map.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/project-map.md)
- **Grafo de Dependencias:** [`docs/architecture/module-dependencies.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/module-dependencies.md)
- **Flujos de Petición y Diagramas de Secuencia:** [`docs/architecture/request-flows.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/request-flows.md)
- **Informe de Auditoría y Reparación:** [`docs/development/audit-and-repair-report.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/development/audit-and-repair-report.md)

---

## 5. Comandos de Validación Local

```bash
# Validar tipado TypeScript
npx tsc --noEmit

# Validar linting y reglas React
npm run lint

# Validar compilación de producción Next.js
npm run build
```
