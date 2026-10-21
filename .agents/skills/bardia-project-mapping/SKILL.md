---
name: bardia-project-mapping
description: Mapear la arquitectura, localizar puntos de entrada, identificar límites Server/Client y seguir el flujo de datos en BARDIA.
---

# BARDIA Project Mapping Skill

Esta skill enseña cómo explorar, comprender y mantener actualizado el mapa técnico y arquitectónico de la plataforma BARDIA (Next.js 15 App Router, React 19, TypeScript, Supabase SSR).

## Cuándo usar esta skill
- Al iniciar una nueva tarea en el repositorio para ubicar los archivos relevantes.
- Cuando se necesita agregar una nueva ruta, página, modal o componente compartido.
- Para rastrear el flujo completo desde la interfaz de usuario hasta la base de datos PostgreSQL.
- Para verificar si un componente debe ser Server Component o Client Component (`'use client'`).
- Antes de realizar refactorizaciones o mover archivos entre módulos.

## Estructura del repositorio

```
c:\Users\Franco\Desktop\BardIA\
├── .agents/skills/            # Sistema de skills de desarrollo
├── docs/
│   ├── architecture/          # Mapeo de DB, relaciones, RLS, dependencias y flujos
│   └── development/           # Índice de skills e informes de auditoría
├── public/                    # Assets estáticos (icon.svg)
├── src/
│   ├── app/                   # Next.js 15 App Router
│   │   ├── (auth)/            # Rutas públicas de autenticación (login, register)
│   │   ├── (dashboard)/       # Rutas protegidas multi-tenant (dashboard, students, workouts, reports, settings)
│   │   └── api/               # API Routes (auth/callback)
│   ├── components/            # UI atómica, layouts y visualizaciones
│   │   ├── ui/                # Componentes base (Card, MetricCard, Button, EmptyState, Badge, etc.)
│   │   ├── charts/            # Gráficos Recharts (VolumeChart, PaceChart, HeartRateChart)
│   │   └── layout/            # Sidebar, Header, UserMenu
│   ├── lib/                   # Clientes Supabase y utilidades
│   │   ├── supabase/          # client.ts (browser), server.ts (RSC), middleware.ts, env.ts
│   │   └── utils.ts           # Funciones puras (formatPace, formatDuration, formatElevation, cn)
│   └── types/                 # Tipos TypeScript del dominio y base de datos
└── middleware.ts              # Proxy de sesión Supabase SSR en Next.js Edge runtime
```

## Procedimiento de mapeo paso a paso

### Paso 1: Ubicar la ruta y la jerarquía de layouts
1. Si la ruta pertenece al panel administrativo (`/dashboard`, `/students`, `/workouts`, `/reports`, `/settings`), revisar primero [`src/app/(dashboard)/layout.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/app/(dashboard)/layout.tsx).
2. Verificar la resolución del tenant:
   - El layout obtiene la sesión del usuario vía `supabase.auth.getUser()`.
   - Consulta `organization_members` con `eq('user_id', user.id)` para resolver el `organization_id`.
   - Si no hay organización, redirige a onboarding o login.
3. Consultar [`docs/architecture/project-map.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/project-map.md) para ver la tabla completa de rutas y componentes.

### Paso 2: Identificar los límites Server vs Client
- **Server Components (Default en App Router):**
  - Consultan datos directamente con `createClient()` de [`src/lib/supabase/server.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/server.ts).
  - Nunca manejan estado React interactivo (`useState`, `useEffect`, `onClick`).
  - Pasan datos serializados como props a los Client Components.
- **Client Components (`'use client'`):**
  - Manejan formularios, modales, interactividad de gráficos y eventos de usuario.
  - Usan `createClient()` de [`src/lib/supabase/client.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/client.ts) para operaciones directas en cliente o llaman a handlers.
  - Ejemplos: `StudentProfileView.tsx`, componentes de `src/components/charts/`.

### Paso 3: Identificar dependencias y puntos únicos de fallo (SPOF)
- Consultar [`docs/architecture/module-dependencies.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/module-dependencies.md).
- Los módulos críticos compartidos son:
  - [`src/lib/supabase/server.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/server.ts) y [`src/lib/supabase/client.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/client.ts).
  - [`src/lib/supabase/env.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/env.ts).
  - [`src/lib/utils.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/utils.ts).
  - [`src/types/database.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/types/database.ts).

### Paso 4: Trazar el flujo de datos
1. UI Interaction -> Client Component / Server Component.
2. Server/Client Supabase Client -> PostgreSQL con RLS y filtro explícito `organization_id`.
3. Ver detalles de secuencias en [`docs/architecture/request-flows.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/request-flows.md).

## Verificación
Tras actualizar o consultar el mapa del proyecto, verificar:
1. Que no existan imports rotos con `npx tsc --noEmit`.
2. Que las rutas nuevas no omitan el layout o la autenticación requerida.
3. Que no se importen componentes de cliente con hooks dentro de Server Components sin el demarcador adecuado.
