# BARDIA — Dependencias entre Módulos y Componentes

## 1. Grafo de Dependencias Internas

```mermaid
graph TD
    subgraph UI_Components [src/components/ui]
        Button[Button.tsx]
        Input[Input.tsx]
        Card[Card.tsx]
        Badge[Badge.tsx]
        EmptyState[EmptyState.tsx]
        StatCard[StatCard.tsx]
        Spinner[LoadingSpinner.tsx]
    end

    subgraph Layout_Components [src/components/layout]
        Navbar[Navbar.tsx]
        Sidebar[Sidebar.tsx]
        Logo[Logo.tsx]
    end

    subgraph Shared_Lib [src/lib]
        Utils[utils.ts]
        SupaClient[supabase/client.ts]
        SupaServer[supabase/server.ts]
        SupaMiddleware[supabase/middleware.ts]
        GetOrg[supabase/get-org.ts]
    end

    subgraph Types [src/types]
        DatabaseTypes[database.ts]
    end

    subgraph App_Pages [src/app/(dashboard)]
        DashLayout[layout.tsx]
        DashPage[dashboard/page.tsx]
        StudentsPage[students/page.tsx]
        StudentNew[students/new/page.tsx]
        StudentDetail[students/[id]/page.tsx]
        StudentView[students/[id]/StudentProfileView.tsx]
        WorkoutsPage[workouts/page.tsx]
        WorkoutNew[workouts/new/page.tsx]
        ReportsPage[reports/page.tsx]
        ReportNew[reports/new/page.tsx]
        ReportDetail[reports/[id]/page.tsx]
        ReportClient[reports/[id]/ReportDetailClient.tsx]
        SettingsPage[settings/organization/page.tsx]
        SettingsClient[settings/organization/OrganizationSettingsClient.tsx]
    end

    %% Relaciones
    DashLayout --> Navbar & Sidebar & SupaServer
    Navbar --> SupaClient & Button
    Sidebar --> Logo & Utils
    Logo --> Utils

    DashPage --> StatCard & Card & Badge & EmptyState & Utils & SupaServer
    StudentsPage --> Card & Badge & EmptyState & Button & SupaServer
    StudentNew --> Card & Input & Button & GetOrg & SupaClient
    StudentDetail --> SupaServer & StudentView
    StudentView --> CombinedChart & TypeChart & StatCard & Card & Badge & EmptyState & Button & Utils & SupaClient & DatabaseTypes

    WorkoutsPage --> Card & Badge & EmptyState & Button & Utils & SupaServer
    WorkoutNew --> Card & Input & Button & Utils & SupaClient & DatabaseTypes

    ReportsPage --> Card & Badge & EmptyState & Button & Utils & SupaServer
    ReportNew --> Card & Input & Button & SupaClient & DatabaseTypes
    ReportDetail --> SupaServer & ReportClient
    ReportClient --> Button & Utils & DatabaseTypes

    SettingsPage --> SupaServer & SettingsClient
    SettingsClient --> Card & Input & Button & Badge & SupaClient & DatabaseTypes

    subgraph Charts [src/components/charts]
        CombinedChart[CombinedEvolutionChart.tsx]
        TypeChart[WorkoutTypeEvolution.tsx]
    end

    CombinedChart --> Utils & DatabaseTypes
    TypeChart --> Utils & Badge & DatabaseTypes
```

---

## 2. Matriz de Reutilización de Componentes Atómicos

| Componente UI | Ubicación | Dependencias Directas | Utilizado Por |
|---|---|---|---|
| `Button` | `src/components/ui/Button.tsx` | `clsx`, `tailwind-merge` (`cn`), `lucide-react` | `Navbar`, `EmptyState`, todos los formularios de alta y pantallas de detalle |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | `src/components/ui/Card.tsx` | `cn` | `DashboardPage`, `StudentsPage`, `StudentProfileView`, `WorkoutNew`, `ReportNew`, `SettingsClient` |
| `Input` | `src/components/ui/Input.tsx` | `cn` | `LoginPage`, `StudentNew`, `WorkoutNew`, `ReportNew`, `SettingsClient` |
| `Badge` | `src/components/ui/Badge.tsx` | `cn` | `DashboardPage`, `StudentsPage`, `StudentProfileView`, `WorkoutsPage`, `ReportsPage`, `SettingsClient`, `WorkoutTypeEvolution` |
| `StatCard` | `src/components/ui/StatCard.tsx` | `cn`, `Card` | `DashboardPage`, `StudentProfileView` |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | `cn`, `Button` | `DashboardPage`, `StudentsPage`, `StudentProfileView`, `WorkoutsPage`, `ReportsPage` |
| `LoadingSpinner` | `src/components/ui/LoadingSpinner.tsx` | `cn` | `Button` (estado `isLoading`) |
| `CombinedEvolutionChart` | `src/components/charts/CombinedEvolutionChart.tsx` | `recharts`, `lucide-react`, `utils` | `StudentProfileView` (modo 3 en 1) |
| `WorkoutTypeEvolution` | `src/components/charts/WorkoutTypeEvolution.tsx` | `recharts`, `lucide-react`, `utils`, `Badge` | `StudentProfileView` (modo por tipo de sesión) |

---

## 3. Utilidades Compartidas (`src/lib/utils.ts`)

| Función | Responsabilidad | Consumidores |
|---|---|---|
| `cn(...inputs)` | Combinación de clases CSS condicionales con `clsx` y resolución de conflictos con `tailwind-merge`. | Prácticamente todos los componentes visuales |
| `formatDuration(seconds)` | Convierte segundos enteros a formato legible (`"2h 15m"` o `"45:30"`). | `DashboardPage`, `WorkoutsPage`, `StudentProfileView`, `ReportDetailClient`, `CombinedEvolutionChart`, `WorkoutTypeEvolution` |
| `formatPace(paceSecKm)` | Formatea ritmo en segundos por km a `"mm:ss /km"`, previniendo desbordes de redondeo (`"4:60"`). | `DashboardPage`, `WorkoutsPage`, `WorkoutNew`, `StudentProfileView`, `ReportDetailClient`, `CombinedEvolutionChart`, `WorkoutTypeEvolution` |
| `formatElevation(meters)` | Formatea ganancia altimétrica en metros enteros (`"+450 m"`). | `CombinedEvolutionChart`, `WorkoutTypeEvolution`, `StudentProfileView` |
| `calculatePace(distanceKm, durationSeconds)` | Computa el ritmo promedio matemático en segundos/km (`duration / distance`). | `WorkoutNew`, cálculo de snapshots |
| `formatDate(dateString)` | Formatea strings ISO o fechas a notación en español regional (`"14 Sep 2026"`). | Todas las vistas de historial y reportes |
