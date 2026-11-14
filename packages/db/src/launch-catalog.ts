import { DEFAULT_LAUNCH_CEU_HOURS } from './ceu-defaults';

/** Catalog seat-time display for launch 1-CEU courses (not the 50-min participation rule). */
export const LAUNCH_CATALOG_DURATION_MINUTES = 60;

export const LAUNCH_DISPLAY_DURATION = '1h';

/**
 * Published CNA online CEU courses maintained by seed for launch.
 * Other slugs may exist in dev DB history; see ARCHIVED_LEGACY_COURSE_SLUGS.
 */
export const CANONICAL_LAUNCH_COURSE_SLUGS = [
  'dementia-care',
  'infection-control',
  'resident-rights',
  'elder-abuse-reporting',
  'mobility-safety',
  'stress-management',
  'communication-skills',
] as const;

/** Superseded or duplicate dev seed rows — soft-deleted during normalize. */
export const ARCHIVED_LEGACY_COURSE_SLUGS = [
  'dementia-care-basics',
  'infection-control-essentials',
  'professional-communication',
  'bloodborne-pathogens',
  'cna-renewal-bundle-intro',
] as const;

export type LaunchCatalogSeed = {
  slug: string;
  ceHours?: number;
  catalogData: { durationMinutes?: number; displayDuration?: string; [key: string]: unknown };
};

export function resolveLaunchCeHours(ceHours?: number): number {
  return ceHours ?? DEFAULT_LAUNCH_CEU_HOURS;
}

/** Merge launch 1-CEU catalog defaults without overwriting multi-hour course metadata. */
export function mergeLaunchCatalogData(
  catalogData: LaunchCatalogSeed['catalogData'],
  ceHours: number,
): LaunchCatalogSeed['catalogData'] {
  if (ceHours !== DEFAULT_LAUNCH_CEU_HOURS) {
    return { ...catalogData };
  }
  return {
    ...catalogData,
    durationMinutes: LAUNCH_CATALOG_DURATION_MINUTES,
    displayDuration: LAUNCH_DISPLAY_DURATION,
  };
}

/** Human-readable course length for catalog UI (configurable per course). */
export function formatCourseDurationMinutes(
  durationMinutes: number,
  options?: { ceHours?: number; displayDuration?: string | null },
): string {
  if (options?.displayDuration?.trim()) {
    return options.displayDuration.trim();
  }
  const ce = options?.ceHours;
  if (ce === DEFAULT_LAUNCH_CEU_HOURS && durationMinutes === LAUNCH_CATALOG_DURATION_MINUTES) {
    return LAUNCH_DISPLAY_DURATION;
  }
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Throws if seed definitions drift from launch 1-CEU policy. */
export function assertLaunchCatalogSeeds(samples: readonly LaunchCatalogSeed[]): void {
  const slugs = new Set<string>();
  for (const sample of samples) {
    if (slugs.has(sample.slug)) {
      throw new Error(`Duplicate launch seed slug: ${sample.slug}`);
    }
    slugs.add(sample.slug);

    const ceHours = resolveLaunchCeHours(sample.ceHours);
    if (ceHours !== DEFAULT_LAUNCH_CEU_HOURS) {
      throw new Error(
        `Launch seed ${sample.slug} must use ${DEFAULT_LAUNCH_CEU_HOURS} CE hour(s), got ${ceHours}`,
      );
    }
    const minutes = sample.catalogData.durationMinutes ?? LAUNCH_CATALOG_DURATION_MINUTES;
    if (minutes !== LAUNCH_CATALOG_DURATION_MINUTES) {
      throw new Error(
        `Launch seed ${sample.slug} must use ${LAUNCH_CATALOG_DURATION_MINUTES} durationMinutes, got ${minutes}`,
      );
    }
    if (!CANONICAL_LAUNCH_COURSE_SLUGS.includes(sample.slug as (typeof CANONICAL_LAUNCH_COURSE_SLUGS)[number])) {
      throw new Error(
        `Launch seed slug ${sample.slug} is not listed in CANONICAL_LAUNCH_COURSE_SLUGS`,
      );
    }
  }

  for (const canonical of CANONICAL_LAUNCH_COURSE_SLUGS) {
    if (!slugs.has(canonical)) {
      throw new Error(`Missing launch seed for canonical slug: ${canonical}`);
    }
  }
}
