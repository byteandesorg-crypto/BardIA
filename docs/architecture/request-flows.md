# BARDIA — Flujos de Peticiones y Ciclo de Vida de Datos

## 1. Flujo de Autenticación, Registro y Creación Atómica de Tenant

```mermaid
sequenceDiagram
    autonumber
    actor Coach as Entrenador
    participant Browser as Navegador (Client)
    participant Middleware as Next.js Middleware
    participant SupaAuth as Supabase Auth
    participant SupaDB as PostgreSQL (RPC)

    %% Registro
    Note over Coach,SupaDB: Flujo de Registro de Nuevo Entrenador
    Coach->>Browser: Completa formulario de registro con nombre de organización
    Browser->>SupaAuth: supabase.auth.signUp(email, password, metadata)
    SupaAuth-->>Browser: Session Token creada
    Browser->>SupaDB: supabase.rpc('create_organization_and_owner', { p_name, p_slug })
    Note over SupaDB: Función SECURITY DEFINER inserta en organizations y organization_members
    SupaDB-->>Browser: Retorna nuevo organization_id
    Browser->>Middleware: Navega a /dashboard (con cookies de sesión)
    Middleware->>SupaAuth: supabase.auth.getUser()
    SupaAuth-->>Middleware: Usuario válido
    Middleware-->>Browser: Permite acceso a /dashboard
```

---

## 2. Flujo de Acceso al Dashboard y Resolución de Tenant Multi-Tenant

```mermaid
sequenceDiagram
    autonumber
    actor Coach as Entrenador
    participant ServerLayout as DashboardLayout (Server)
    participant ServerPage as DashboardPage (Server)
    participant SupaDB as PostgreSQL (RLS)

    Coach->>ServerLayout: GET /dashboard
    ServerLayout->>SupaDB: auth.getUser()
    ServerLayout->>SupaDB: SELECT organization_members WHERE user_id = user.id
    alt Usuario no tiene organización
        ServerLayout->>SupaDB: rpc('create_organization_and_owner') de rescate
    end
    ServerLayout-->>Coach: Renderiza Sidebar y Navbar con nombre del equipo

    ServerPage->>SupaDB: SELECT students WHERE organization_id = orgId
    ServerPage->>SupaDB: SELECT workouts WHERE organization_id = orgId ORDER BY workout_date DESC
    Note over SupaDB: RLS filtra por tenant + filtro explícito en query
    SupaDB-->>ServerPage: Datos consolidados
    ServerPage-->>Coach: HTML generado con KPIs, Alumnos y Sesiones recientes
```

---

## 3. Flujo de Carga de Entrenamiento y Computación de Altimetría

```mermaid
sequenceDiagram
    autonumber
    actor Coach as Entrenador
    participant ClientForm as WorkoutForm (Client)
    participant Utils as utils.ts (calculatePace)
    participant SupaDB as PostgreSQL

    Coach->>ClientForm: Ingresa distancia (ej. 14.5 km) y duración (1h 15m 00s)
    ClientForm->>Utils: calculatePace(14.5, 4500)
    Utils-->>ClientForm: Retorna ritmo (310 seg/km -> 5:10 /km)
    ClientForm-->>Coach: Muestra en vivo el ritmo calculado con Badge de velocidad
    Coach->>ClientForm: Ingresa desnivel (+420m), FC y notas técnicas; envía formulario
    ClientForm->>SupaDB: INSERT INTO workouts (organization_id, student_id, distance_km, elevation_gain_m, average_pace_sec_km, created_by, ...)
    SupaDB-->>ClientForm: Sesión registrada con éxito
    ClientForm->>Coach: Redirige a /students/[id] con router.refresh()
```

---

## 4. Flujo Seguro de Documentación y URLs Firmadas de Storage

```mermaid
sequenceDiagram
    autonumber
    actor Coach as Entrenador
    participant View as StudentProfileView (Client)
    participant Storage as Supabase Storage (Bucket 'documents')
    participant DB as PostgreSQL (student_documents)

    %% Subida
    Note over Coach,DB: Subida de Documento Privado
    Coach->>View: Selecciona archivo (apto_medico.pdf) y título
    View->>Storage: upload('org_1/student_5/17896670_apto.pdf', file)
    Storage-->>View: Archivo almacenado de forma privada
    View->>DB: INSERT INTO student_documents (org_id, student_id, file_path, ...)
    DB-->>View: Registro confirmado

    %% Descarga
    Note over Coach,DB: Descarga / Visualización Segura
    Coach->>View: Clic en "Descargar / Ver"
    View->>Storage: createSignedUrl(file_path, expiresIn: 120)
    Note over Storage: Valida pertenencia de la sesión a la organización
    Storage-->>View: Devuelve signedUrl con token temporal (2 min)
    View->>Coach: Abre documento en nueva pestaña con acceso temporal
```

---

## 5. Flujo de Emisión e Impresión Editorial de Informes A4

```mermaid
sequenceDiagram
    autonumber
    actor Coach as Entrenador
    participant NewReport as NewReportPage (Client)
    participant DB as PostgreSQL
    participant DetailPage as ReportDetailPage (Server)
    participant ClientA4 as ReportDetailClient (CSS Print)

    Coach->>NewReport: Selecciona alumno y rango de fechas (ej: 01/09 al 30/09)
    NewReport->>DB: SELECT workouts WHERE student_id = X AND workout_date BETWEEN fecha_desde AND fecha_hasta
    DB-->>NewReport: Retorna 14 entrenamientos
    NewReport->>NewReport: Calcula suma de km, desnivel total, ritmo medio y genera snapshot JSON
    Coach->>NewReport: Ingresa conclusiones técnicas profesionales y confirma
    NewReport->>DB: INSERT INTO reports (org_id, student_id, title, date_from, date_to, metrics_snapshot, coach_summary, created_by)
    DB-->>NewReport: Reporte guardado con ID 10
    NewReport->>DetailPage: Redirige a /reports/10

    DetailPage->>DB: SELECT report JOIN student JOIN organization
    DB-->>DetailPage: Reporte con snapshot inmutable
    DetailPage->>ClientA4: Renderiza vista editorial
    Coach->>ClientA4: Clic en "Descargar / Imprimir PDF (A4)"
    ClientA4->>ClientA4: window.print() (Reglas @media print ocultan UI y formatean a hoja A4)
    ClientA4-->>Coach: Diálogo nativo para guardar como PDF o imprimir
```
