import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
export {
  DEFAULT_LAUNCH_CEU_HOURS,
  MINUTES_PER_ONLINE_CEU_HOUR,
  formatCourseDurationMinutes,
  formatOnlineCeuHours,
  LAUNCH_CATALOG_DURATION_MINUTES,
  LAUNCH_DISPLAY_DURATION,
  mergeLaunchCatalogData,
  requiredActiveParticipationMinutes,
  resolveLaunchCeHours,
} from './ceu-defaults';
export {
  ARCHIVED_LEGACY_COURSE_SLUGS,
  CANONICAL_LAUNCH_COURSE_SLUGS,
  assertLaunchCatalogSeeds,
  type LaunchCatalogSeed,
} from './launch-catalog';
