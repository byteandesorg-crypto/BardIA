import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea segundos a hh:mm:ss o mm:ss */
export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '00:00';
  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Formatea ritmo en segundos por km a mm:ss /km evitando desbordes tipo 4:60 */
export function formatPace(paceSecKm?: number | null): string {
  if (!paceSecKm || paceSecKm <= 0) return '-';
  const totalSecs = Math.round(paceSecKm);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/** Calcula ritmo en segundos/km a partir de distancia en km y tiempo en segundos */
export function calculatePace(distanceKm?: number | null, durationSeconds?: number | null): number | null {
  if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return null;
  return Math.round(durationSeconds / distanceKm);
}

/** Formatea fecha en español (ej: 14 Sep 2026) */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/** Formatea desnivel en metros positivos (+X m) */
export function formatElevation(meters?: number | null): string {
  if (meters === null || meters === undefined || isNaN(meters)) return '-';
  return `+${Math.round(meters).toLocaleString('es-AR')} m`;
}
