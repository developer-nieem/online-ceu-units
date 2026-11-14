/** Display helpers for online CE hours (aligned with @calace/db ceu-defaults). */
export function formatOnlineCeuHours(ceHours: number): string {
  const n = Number(ceHours);
  if (!Number.isFinite(n) || n <= 0) return '0 Online CE hours';
  const unit = n === 1 ? 'hour' : 'hours';
  const value = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${value} Online CE ${unit}`;
}

const LAUNCH_ONE_CEU_HOURS = 1;
const LAUNCH_CATALOG_DURATION_MINUTES = 60;

/** Catalog seat-time label; respects API displayDuration when present. */
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
