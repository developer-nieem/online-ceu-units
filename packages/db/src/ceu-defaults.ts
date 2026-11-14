/**
 * Launch catalog defaults — individual courses may set 2, 3, or 4 CE hours explicitly.
 * Mirrors apps/api/src/config/ceu-defaults.ts — keep both in sync.
 */
export const DEFAULT_LAUNCH_CEU_HOURS = 1;

/** CDPH online CE: active participation minutes required per 1.0 CEU hour. */
export const MINUTES_PER_ONLINE_CEU_HOUR = 50;

export function requiredActiveParticipationMinutes(ceHours: number): number {
  return Math.ceil(Number(ceHours) * MINUTES_PER_ONLINE_CEU_HOUR);
}

/** Learner-facing label, e.g. "1 Online CE hour" / "2 Online CE hours". */
export function formatOnlineCeuHours(ceHours: number): string {
  const n = Number(ceHours);
  if (!Number.isFinite(n) || n <= 0) return '0 Online CE hours';
  const unit = n === 1 ? 'hour' : 'hours';
  const value = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${value} Online CE ${unit}`;
}

export {
  formatCourseDurationMinutes,
  LAUNCH_CATALOG_DURATION_MINUTES,
  LAUNCH_DISPLAY_DURATION,
  mergeLaunchCatalogData,
  resolveLaunchCeHours,
} from './launch-catalog';
