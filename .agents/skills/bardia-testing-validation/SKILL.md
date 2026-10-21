---
name: bardia-testing-validation
description: Validar cambios de forma reproducible mediante lint, typecheck, build, pruebas funcionales y verificación de aislamiento multi-tenant en BARDIA.
---

# BARDIA Testing & Validation Skill

Esta skill define la estrategia de pruebas, verificación estática y validación funcional para garantizar que cualquier cambio en BARDIA sea confiable, reproducible y seguro antes de su despliegue.

## Cuándo usar esta skill
- Al finalizar cualquier corrección, refactorización o nueva funcionalidad.
- Antes de confirmar un commit o abrir un Pull Request hacia `main`.
- Para validar la integridad de flujos funcionales críticos (alumnos, entrenamientos, métricas, reportes).
- Para auditar y documentar el estado real de los controles del proyecto.

## Matriz de controles disponibles en BARDIA

| Control | Comando | Propósito | Criterio de éxito |
| :--- | :--- | :--- | :--- |
| **Typecheck** | `npx tsc --noEmit` | Valida todos los tipos TypeScript del proyecto | Código de salida 0, 0 errores |
| **Linting** | `npm run lint` | Valida reglas de Next.js, React Hooks y sintaxis | Código de salida 0, 0 advertencias críticas |
| **Build** | `npm run build` | Compila el bundle de producción y genera páginas SSG/SSR | Código de salida 0, bundle generado |
| **Dev Server** | `npm run dev` | Inicia el servidor de desarrollo local para verificación interactiva | Servidor escuchando en `http://localhost:3000` |

## Procedimiento de validación paso a paso

### Paso 1: Ejecución de la suite estática
Ejecutar en orden los controles estáticos:
```bash
# 1. Typecheck estricto
npx tsc --noEmit

# 2. Análisis de ESLint
npm run lint

# 3. Compilación de producción
npm run build
```
- **Regla estricta:** Si alguno de estos comandos falla, el cambio **no está listo**. No se debe realizar commit ni afirmar que el cambio funciona hasta que los 3 comandos salgan con código 0.

### Paso 2: Validación de flujos funcionales críticos
Comprobar los siguientes flujos funcionales en el código y en runtime cuando el entorno lo permita:

1. **Gestión de Alumnos (`/students`):**
   - Listado de alumnos activos/inactivos filtrados por tenant.
   - Creación de nuevo alumno con validación de campos obligatorios.
   - Edición de datos personales y estado (`is_active`).
   - Carga y visualización de documentos en bucket privado.
2. **Registro de Entrenamientos (`/workouts` y `/workouts/new`):**
   - Selección de alumno perteneciente a la misma organización.
   - Cálculo automático del ritmo a partir de distancia y duración.
   - Registro de autoría (`created_by`) y organización (`organization_id`).
3. **Métricas y Visualizaciones (`/dashboard` y `/students/[id]`):**
   - Gráfico de volumen semanal/mensual sin errores de Recharts.
   - Distribución de zonas de frecuencia cardíaca.
   - Formateo correcto de ritmos (sin segundos `= 60`), elevación (`+X m`) y duraciones.
4. **Informes Editoriales (`/reports` y `/reports/[id]`):**
   - Generación de snapshot inmutable de métricas.
   - Renderizado optimizado para impresión A4 (`@media print`).

### Paso 3: Validación de aislamiento Multi-Tenant (Seguridad Negativa)
- Verificar que las consultas en `src/app/(dashboard)/` incluyan `.eq('organization_id', orgId)`.
- Si se simula un usuario de la Organización A, verificar que no pueda consultar alumnos o entrenamientos de la Organización B.
- Consultar los casos de prueba de seguridad detallados en [`docs/architecture/security-rls.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/security-rls.md).

### Paso 4: Registro y documentación de resultados reales
- Documentar siempre la evidencia real obtenida (código de salida, tiempo de ejecución, rutas generadas).
- **Nunca afirmar que una prueba pasó si no fue ejecutada.**
- Si una prueba no puede ejecutarse (por ejemplo, interacción con base de datos remota porque el proyecto de Supabase se encuentra pausado / `INACTIVE`), registrarlo explícitamente:
  - *Bloqueo:* Proyecto Supabase `jlxqybmesrrrsnzdewdt` inactivo en nivel gratuito.
  - *Mitigación:* Verificación estática con `tsc`, validación de lógica de queries con filtros explícitos y revisión de esquema documentado.

## Resumen de comprobación final
- [ ] `npx tsc --noEmit` = 0
- [ ] `npm run lint` = 0
- [ ] `npm run build` = 0
- [ ] Diff de Git limpio de secretos o archivos temporales.
- [ ] Resultados documentados con evidencia verificable.
