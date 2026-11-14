/**
 * Mirrors packages/db/src/ceu-defaults.ts — keep both files in sync when changing launch defaults.
 */
export const DEFAULT_LAUNCH_CEU_HOURS = 1;

export const MINUTES_PER_ONLINE_CEU_HOUR = 50;

export function requiredActiveParticipationMinutes(ceHours: number): number {
  return Math.ceil(Number(ceHours) * MINUTES_PER_ONLINE_CEU_HOUR);
}

export function formatOnlineCeuHours(ceHours: number): string {
  const n = Number(ceHours);
  if (!Number.isFinite(n) || n <= 0) return '0 Online CE hours';
  const unit = n === 1 ? 'hour' : 'hours';
  const value = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${value} Online CE ${unit}`;
}

const LAUNCH_ONE_CEU_HOURS = 1;
const LAUNCH_CATALOG_DURATION_MINUTES = 60;

/** Mirrors packages/db/src/launch-catalog.ts formatCourseDurationMinutes */
export function formatCourseDurationMinutes(
  durationMinutes: number,
  options?: { ceHours?: number; displayDuration?: string | null },
): string {
  if (options?.displayDuration?.trim()) {
    return options.displayDuration.trim();
  }
  const ce = options?.ceHours;
  if (ce === LAUNCH_ONE_CEU_HOURS && durationMinutes === LAUNCH_CATALOG_DURATION_MINUTES) {
    return '1h';
  }
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
