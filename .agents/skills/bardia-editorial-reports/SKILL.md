---
name: bardia-editorial-reports
description: Diseñar, generar e imprimir informes deportivos editoriales A4 con métricas históricas inmutables y estilos de impresión en BARDIA.
---

# BARDIA Editorial Reports Skill

Esta skill enseña cómo estructurar, generar e imprimir informes deportivos editoriales de alta calidad en formato A4 para atletas de BARDIA, garantizando inmutabilidad histórica mediante snapshots JSONB y estilos `@media print`.

## Cuándo usar esta skill
- Al diseñar nuevas secciones o métricas dentro de los informes para atletas (`/reports/[id]`).
- Al ajustar la paginación, saltos de página y layout de impresión A4 (`@page`, `@media print`).
- Al implementar el flujo de creación de informes (`/reports/new`) y snapshot de métricas.
- Al optimizar la visualización de datos históricos consolidados (volumen mensual, desniveles, picos de pulso).

## Principios arquitectónicos de los informes en BARDIA

### 1. Inmutabilidad de los Informes (Snapshots JSONB)
- **Problema:** Si un informe calcula métricas dinámicamente cada vez que se abre, y un entrenador edita o borra un entrenamiento de hace 6 meses, el informe histórico cambiaría retroactivamente, violando la integridad de auditoría deportiva.
- **Solución en BARDIA:** Al crear un informe (`reports`), se calculan las métricas del período (`period_start` a `period_end`) y se persisten en la columna `metrics_snapshot` (JSONB).
  ```typescript
  interface ReportMetricsSnapshot {
    total_distance_km: number;
    total_duration_seconds: number;
    total_elevation_gain_m: number;
    avg_pace_seconds: number | null;
    avg_heart_rate: number | null;
    workouts_count: number;
    zones_distribution?: Record<string, number>;
  }
  ```
- Al visualizar el informe (`/reports/[id]`), **siempre** se leen los datos de `metrics_snapshot`, asegurando que el documento impreso sea idéntico en cualquier momento del tiempo.

### 2. Estilos editoriales A4 y `@media print`
Los informes de BARDIA están diseñados para imprimirse directamente desde el navegador o guardarse como PDF nativo mediante `window.print()`.

#### Reglas de CSS para Impresión A4:
```css
@media print {
  /* Configuración de la hoja A4 */
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 20mm 15mm;
  }

  /* Ocultar elementos de navegación y acciones de pantalla */
  header,
  nav,
  aside,
  button,
  .no-print {
    display: none !important;
  }

  /* Forzar fondo blanco y texto oscuro de alto contraste */
  body {
    background: white !important;
    color: #0f172a !important;
  }

  /* Evitar saltos de página indeseados dentro de tarjetas o gráficos */
  .report-card,
  .metric-card,
  .chart-container {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Forzar salto de página limpio si el informe es multipágina */
  .page-break {
    break-after: page;
    page-break-after: always;
  }
}
```

### 3. Anatomía del informe editorial
1. **Encabezado Institucional:**
   - Logo del club/organización y nombre de BARDIA.
   - Datos del atleta (Nombre completo, categoría, entrenador asignado).
   - Período evaluado (Fecha inicial - Fecha final).
2. **Resumen Ejecutivo de Métricas (KPIs):**
   - Kilómetros totales recorridos.
   - Desnivel positivo acumulado ($+D$).
   - Tiempo total de entrenamiento.
   - Ritmo medio del período.
3. **Desglose de Entrenamientos:**
   - Tabla cronológica con tipo de actividad, distancia, desnivel, pulso medio y sensaciones (RPE).
4. **Comentarios del Entrenador:**
   - Conclusiones cualitativas, áreas de mejora y objetivos para el siguiente ciclo.
5. **Pie de Página Editorial:**
   - Fecha de generación del informe, identificador único y número de página.

## Verificación
1. Probar la visualización en pantalla y en la vista previa de impresión del navegador (`Ctrl + P`).
2. Verificar que no aparezca la barra lateral (Sidebar) ni botones de navegación en la vista previa de impresión.
3. Validar con `npx tsc --noEmit` que los campos de `metrics_snapshot` tengan tipado estricto.
