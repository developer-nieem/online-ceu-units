/**
 * CI/dev check: launch seed definitions stay at 1 CE hour and 60-minute catalog duration.
 */
import { assertLaunchCatalogSeeds } from '../src/launch-catalog';

// Keep in sync with SAMPLE_COURSES in seed.ts (slugs, ceHours, catalogData.durationMinutes only).
const LAUNCH_SEED_SNAPSHOT = [
  { slug: 'dementia-care', catalogData: { durationMinutes: 60 } },
  { slug: 'infection-control', catalogData: { durationMinutes: 60 } },
  { slug: 'elder-abuse-reporting', catalogData: { durationMinutes: 60 } },
  { slug: 'resident-rights', catalogData: { durationMinutes: 60 } },
  { slug: 'mobility-safety', catalogData: { durationMinutes: 60 } },
  { slug: 'stress-management', catalogData: { durationMinutes: 60 } },
  { slug: 'communication-skills', catalogData: { durationMinutes: 60 } },
] as const;

assertLaunchCatalogSeeds(LAUNCH_SEED_SNAPSHOT);
console.log('Launch catalog seed verification passed.');
