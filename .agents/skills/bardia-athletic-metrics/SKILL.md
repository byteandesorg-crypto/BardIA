---
name: bardia-athletic-metrics
description: Calcular, formatear y visualizar métricas de running, trail running y deportes de montaña (ritmo, desnivel, zonas FC, volumen) en BARDIA.
---

# BARDIA Athletic Metrics Skill

Esta skill enseña las fórmulas deportivas, reglas de redondeo, prevención de errores matemáticos y visualizaciones con Recharts para métricas de running, trail running y montaña en BARDIA.

## Cuándo usar esta skill
- Al implementar o modificar cálculos de ritmo medio, ritmo ponderado o desniveles.
- Al agregar o editar gráficos de rendimiento (volumen de kilómetros, elevación acumulada, ritmo y pulso).
- Al calcular zonas de frecuencia cardíaca (Z1 a Z5) en el perfil del atleta (`athlete_profiles`).
- Al solucionar problemas de renderizado o discrepancias numéricas en los tableros deportivos.

## Fórmulas canónicas y funciones de utilidad

Todas las funciones de cálculo y formateo de métricas deben ubicarse o consumirse desde [`src/lib/utils.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/utils.ts).

### 1. Cálculo y formateo de Ritmo (Pace en min/km)
- **Fórmula de segundos por kilómetro:**
  $$\text{paceSecKm} = \frac{\text{durationSeconds}}{\text{distanceKm}}$$
- **Regla crítica de redondeo:**
  Para evitar el error de cálculo `4:60 /km`, redondear siempre los segundos totales primero:
  ```typescript
  export function formatPace(paceSeconds: number | null | undefined): string {
    if (!paceSeconds || paceSeconds <= 0 || !isFinite(paceSeconds)) return '-:-- /km';
    const totalSec = Math.round(paceSeconds);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  }
  ```
- **Cálculo a partir de distancia y duración:**
  ```typescript
  export function calculatePace(distanceKm: number, durationSeconds: number): number | null {
    if (distanceKm <= 0 || durationSeconds <= 0) return null;
    return durationSeconds / distanceKm;
  }
  ```

### 2. Formateo de Duración
- Convertir segundos a formato legible `HH:MM:SS` o `MM:SS`:
  ```typescript
  export function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';
    const totalSec = Math.round(seconds);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const remainingSeconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  ```

### 3. Desnivel y Elevación (Trail Running & Montaña)
- La ganancia de elevación positiva (`elevation_gain_m`) se expresa en metros enteros:
  ```typescript
  export function formatElevation(meters: number | null | undefined): string {
    if (meters === null || meters === undefined) return '-';
    return `+${Math.round(meters).toLocaleString('es-AR')} m`;
  }
  ```

### 4. Zonas de Frecuencia Cardíaca
En `athlete_profiles.training_zones` se guardan las 5 zonas de entrenamiento basadas en la FC Máxima (`max_hr`) o el umbral de lactato:
- **Z1 (Recuperación activa):** 50% - 60% FC Máx
- **Z2 (Resistencia aeróbica base):** 60% - 70% FC Máx
- **Z3 (Tempo / Aeróbico medio):** 70% - 80% FC Máx
- **Z4 (Umbral anaeróbico):** 80% - 90% FC Máx
- **Z5 (Capacidad máxima / VO2 Máx):** 90% - 100% FC Máx

## Visualizaciones con Recharts

Los componentes de visualización se ubican en `src/components/charts/`:
1. **`VolumeChart.tsx`:** BarChart o AreaChart para distancia semanal y desnivel.
2. **`PaceChart.tsx`:** LineChart que muestra la evolución del ritmo medio.
3. **`HeartRateChart.tsx`:** Gráfico de distribución de tiempo en zonas de pulso.

### Buenas prácticas con Recharts en Next.js App Router
- Marcar siempre los componentes de gráficos con `'use client';`.
- Envolver el gráfico en un contenedor con `ResponsiveContainer width="100%" height={300}`.
- Manejar arrays vacíos renderizando un estado alternativo limpio o con [`src/components/ui/EmptyState.tsx`](file:///c:/Users/Franco/Desktop/BardIA/src/components/ui/EmptyState.tsx) para evitar que Recharts falle con datos nulos.
- Usar la paleta de colores corporativa de BARDIA (azul petróleo, verde esmeralda y acentos cálidos).

## Verificación
1. Validar que ninguna división por cero retorne `Infinity` o `NaN` en las vistas.
2. Ejecutar `npx tsc --noEmit` y `npm run build` para garantizar que los tipos de datos en gráficos sean coherentes.
