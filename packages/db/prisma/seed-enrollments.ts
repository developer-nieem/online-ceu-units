import {
  EnrollmentStatus,
  type PrismaClient,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  DEV_SEED_STAFF_PASSWORD,
  isDevSeedContext,
} from './seed-dev-auth';

/** Matches apps/api auth.service.ts BCRYPT_ROUNDS */
const BCRYPT_ROUNDS = 12;

export const DEMO_LEARNER_EMAIL = 'jane.doe@example.com';

const DEMO_ENROLLMENTS = [
  {
    courseSlug: 'legal-ethical-nursing-practice',
    status: EnrollmentStatus.COMPLETED,
    completedAt: new Date('2026-04-12T12:00:00Z'),
    progressPercent: 100,
  },
  {
    courseSlug: 'workplace-violence-prevention',
    status: EnrollmentStatus.COMPLETED,
    completedAt: new Date('2026-03-05T12:00:00Z'),
    progressPercent: 100,
  },
] as const;

export async function seedDemoLearner(
  prisma: PrismaClient,
  tenantId: string,
  learnerRoleId: string,
  jurisdictionId: string,
  professionId: string,
): Promise<string> {
  const passwordHash = isDevSeedContext()
    ? await bcrypt.hash(DEV_SEED_STAFF_PASSWORD, BCRYPT_ROUNDS)
    : undefined;

  const devAuthFields = passwordHash
    ? {
        passwordHash,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      }
    : {};

  const learner = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId,
        email: DEMO_LEARNER_EMAIL,
      },
    },
    create: {
      tenantId,
      email: DEMO_LEARNER_EMAIL,
      firstName: 'Jane',
      lastName: 'Doe',
      status: UserStatus.ACTIVE,
      ...devAuthFields,
      metadata: {
        legacyAdminId: 'learner-jane-doe',
        note: 'Demo learner for enrollment testing.',
      },
    },
    update: {
      firstName: 'Jane',
      lastName: 'Doe',
      status: UserStatus.ACTIVE,
      ...devAuthFields,
    },
  });

  if (passwordHash) {
    const stored = await prisma.user.findFirst({
      where: { tenantId, email: DEMO_LEARNER_EMAIL },
      select: { passwordHash: true },
    });
    if (!stored?.passwordHash) {
      throw new Error('seedDemoLearner: passwordHash missing for demo learner');
    }
    const valid = await bcrypt.compare(DEV_SEED_STAFF_PASSWORD, stored.passwordHash);
    if (!valid) {
      throw new Error(
        'seedDemoLearner: passwordHash for demo learner does not match DEV_SEED_STAFF_PASSWORD',
      );
    }
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId_tenantId: {
        userId: learner.id,
        roleId: learnerRoleId,
        tenantId,
      },
    },
    create: {
      userId: learner.id,
      roleId: learnerRoleId,
      tenantId,
    },
    update: {},
  });

  await prisma.learnerProfile.upsert({
    where: { userId: learner.id },
    create: {
      userId: learner.id,
      tenantId,
      jurisdictionId,
      professionId,
      onboardingComplete: true,
      profileData: {
        fullLegalName: 'Jane Doe',
        primaryEmail: DEMO_LEARNER_EMAIL,
        seeded: true,
      },
    },
    update: {
      jurisdictionId,
      professionId,
      onboardingComplete: true,
    },
  });

  return learner.id;
}

export async function seedDemoEnrollments(
  prisma: PrismaClient,
  tenantId: string,
  learnerUserId: string,
): Promise<number> {
  let count = 0;

  for (const seed of DEMO_ENROLLMENTS) {
    const course = await prisma.course.findFirst({
      where: {
        tenantId,
        slug: seed.courseSlug,
        deletedAt: null,
      },
      include: {
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!course?.versions[0]) {
      console.warn(`  Skipping enrollment seed — course not found: ${seed.courseSlug}`);
      continue;
    }

    const courseVersionId = course.versions[0].id;
    const enrolledAt =
      seed.status === EnrollmentStatus.COMPLETED
        ? new Date(seed.completedAt.getTime() - 7 * 24 * 60 * 60 * 1000)
        : seed.startedAt ?? new Date();

    await prisma.enrollment.upsert({
      where: {
        userId_courseVersionId: {
          userId: learnerUserId,
          courseVersionId,
        },
      },
      create: {
        tenantId,
        userId: learnerUserId,
        courseVersionId,
        status: seed.status,
        enrolledAt,
        startedAt: 'startedAt' in seed ? seed.startedAt : enrolledAt,
        completedAt: 'completedAt' in seed ? seed.completedAt : null,
        metadata: { progressPercent: seed.progressPercent },
      },
      update: {
        status: seed.status,
        enrolledAt,
        startedAt: 'startedAt' in seed ? seed.startedAt : enrolledAt,
        completedAt: 'completedAt' in seed ? seed.completedAt : null,
        metadata: { progressPercent: seed.progressPercent },
        deletedAt: null,
      },
    });

    count += 1;
  }

  return count;
}
