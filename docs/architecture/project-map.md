# BARDIA — Mapa Arquitectónico del Repositorio

## 1. Visión Estructural del Proyecto

BARDIA está construido sobre **Next.js 15.2.1 (App Router)**, **React 19**, **TypeScript 5.8** y **Tailwind CSS 3.4**. La aplicación adopta el paradigma moderno de Server Components por defecto, minimizando el envío de JavaScript al cliente y delegando la interactividad pesada a Client Components específicos.

```
c:\Users\Franco\Desktop\BardIA
├── .agents/skills/              # Sistema de skills de desarrollo para agentes y desarrolladores
├── docs/                        # Documentación técnica, arquitectura y reportes de auditoría
│   ├── architecture/            # Esquema DB, relaciones, RLS, mapas de proyecto y flujos
│   └── development/             # Reportes de auditoría y guía de skills
├── public/                      # Assets estáticos servidos por Next.js
│   ├── favicon.ico              # Favicon del sitio
│   └── icon.svg                 # Isotipo vectorial de altimetría BARDIA
├── src/
│   ├── app/                     # Rutas, layouts y páginas del App Router de Next.js
│   │   ├── (auth)/              # Grupo de rutas de autenticación
│   │   │   └── login/page.tsx   # Login y registro de organizaciones (Client Component)
│   │   ├── (dashboard)/         # Grupo de rutas protegidas del panel principal
│   │   │   ├── layout.tsx       # Layout maestro con Sidebar, Navbar y resolución de tenant
│   │   │   ├── dashboard/       # Dashboard principal con métricas globales y accesos rápidos
│   │   │   ├── students/        # Gestión de deportistas (listado, alta, ficha técnica)
│   │   │   ├── workouts/        # Registro y visualización de entrenamientos y altimetrías
│   │   │   ├── reports/         # Informes editoriales A4 imprimibles y exportables en PDF
│   │   │   └── settings/        # Configuración institucional y miembros de la organización
│   │   ├── globals.css          # Estilos globales y tokens de diseño Tailwind / Print CSS
│   │   ├── layout.tsx           # Layout raíz con configuración de fuente Inter y metadatos
│   │   └── page.tsx             # Redirección raíz condicional (/ -> /dashboard o /login)
│   ├── components/
│   │   ├── layout/              # Componentes de estructura visual (Navbar, Sidebar, Logo)
│   │   └── ui/                  # Componentes atómicos de diseño (Button, Card, Input, etc.)
│   ├── lib/
│   │   ├── supabase/            # Clientes SSR para navegador, servidor y middleware
│   │   └── utils.ts             # Utilidades de formato de ritmos, duraciones, fechas y estilos
│   ├── middleware.ts            # Middleware de Next.js para sesión y redirección de rutas
│   └── types/
│       └── database.ts          # Contratos TypeScript de entidades de dominio y base de datos
├── next.config.mjs              # Configuración de Next.js y dominios de imágenes de Supabase
├── package.json                 # Dependencias y scripts de ejecución
├── postcss.config.mjs           # Pipeline de PostCSS
├── tailwind.config.ts           # Paleta de colores inspirada en la Cordillera y Neuquén
└── tsconfig.json                # Configuración estricta de TypeScript 5.8
```

---

## 2. Mapa de Rutas y Distribución Server vs Client Components

| Ruta URL | Tipo de Componente | Archivo de Entrada | Responsabilidad Principal |
|---|---|---|---|
| `/` | Server Component | `src/app/page.tsx` | Redirección inmediata según el estado de la sesión (`/dashboard` o `/login`). |
| `/login` | Client Component (`'use client'`) | `src/app/(auth)/login/page.tsx` | Formulario interactivo con tabs de acceso y creación de nueva organización (RPC). |
| `/(dashboard)` | Server Layout | `src/app/(dashboard)/layout.tsx` | Valida sesión activa, consulta membresía del tenant y renderiza Navbar y Sidebar. |
| `/dashboard` | Server Component | `src/app/(dashboard)/dashboard/page.tsx` | Consulta alumnos y sesiones recientes; agrega métricas de km y desnivel acumulado. |
| `/students` | Server Component | `src/app/(dashboard)/students/page.tsx` | Grid de tarjetas de deportistas con estado de emergencia y acceso a fichas técnicas. |
| `/students/new` | Client Component (`'use client'`) | `src/app/(dashboard)/students/new/page.tsx` | Formulario de alta de deportista en 3 secciones: personal, deportivo y emergencia. |
| `/students/[id]` | Server Component + Client Child | `src/app/(dashboard)/students/[id]/page.tsx` <br/> `StudentProfileView.tsx` <br/> `CombinedEvolutionChart.tsx` <br/> `WorkoutTypeEvolution.tsx` | Página server valida existencia e inyecta datos al cliente interactivo con Recharts, Centro de Progresión (3 en 1 + desglose por tipo), tabs y subida de archivos. |
| `/workouts` | Server Component | `src/app/(dashboard)/workouts/page.tsx` | Tabla consolidada de sesiones deportivas con ritmos, duración y desnivel. |
| `/workouts/new` | Client Component (`'use client'`) | `src/app/(dashboard)/workouts/new/page.tsx` | Carga de entrenamiento con cálculo automático en vivo del ritmo medio (min/km). |
| `/reports` | Server Component | `src/app/(dashboard)/reports/page.tsx` | Catálogo de informes emitidos listos para consulta o impresión. |
| `/reports/new` | Client Component (`'use client'`) | `src/app/(dashboard)/reports/new/page.tsx` | Filtro por período, cálculo del snapshot inmutable de métricas y generación de informe. |
| `/reports/[id]` | Server Component + Client Child | `src/app/(dashboard)/reports/[id]/page.tsx` <br/> `ReportDetailClient.tsx` | Documento editorial A4 optimizado para pantalla y estilos de impresión (`window.print()`). |
| `/settings/organization` | Server Component + Client Child | `src/app/(dashboard)/settings/organization/page.tsx` <br/> `OrganizationSettingsClient.tsx` | Edición del nombre del estudio deportivo y revisión de miembros y roles. |

---

## 3. Puntos Críticos y Puntos Únicos de Fallo (SPOF)

1. **`src/middleware.ts` + `src/lib/supabase/middleware.ts`:**  
   - Punto de entrada de todas las solicitudes HTTP excepto estáticos.  
   - Si falla la comunicación con cookies o la inicialización del cliente Supabase, la aplicación devuelve un error 500 bloqueando todo el tráfico.
2. **`src/lib/supabase/server.ts`:**  
   - Creador central de sesiones en Server Components mediante `cookies()`.  
   - Next.js 15 requiere que `cookies()` sea resuelto como promesa asíncrona (`await cookies()`).
3. **`src/app/(dashboard)/layout.tsx`:**  
   - Layout obligatorio para todas las rutas operativas.  
   - Si la consulta de membresía o la inicialización de organización falla, ningún módulo del dashboard puede cargarse.
4. **`src/lib/supabase/get-org.ts`:**  
   - Helper de resolución de tenant compartido por el cliente. Si no resuelve la organización, el usuario no puede registrar alumnos ni entrenamientos.
