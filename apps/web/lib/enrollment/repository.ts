import {
  CourseStatus,
  CourseVersionStatus,
  EnrollmentStatus,
  UserStatus,
  prisma,
  type Prisma,
} from '@calace/db';

import { DEFAULT_TENANT_SLUG, parseCatalogData } from '@/lib/cms/db/mappers';
import { courseRequiresCheckout } from '@/lib/catalog-pricing';
import { getOrderForUser } from '@/lib/checkout/order-repository';

import {
  formatLearnerName,
  mapDbEnrollment,
  parseEnrollmentMetadata,
} from './mappers';
import type {
  AdminEnrollmentRecord,
  CreateEnrollmentInput,
  LearnerEnrollmentRecord,
  LearnerEnrollmentStatus,
} from './types';

const enrollmentInclude = {
  courseVersion: {
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  },
  user: {
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error('Default tenant not found. Run `pnpm --filter @calace/db db:seed`.');
  }

  return tenant.id;
}

export async function findLearnerUserByEmail(email: string) {
  const tenantId = await getTenantId();
  return prisma.user.findFirst({
    where: {
      tenantId,
      email: email.toLowerCase(),
      deletedAt: null,
      status: UserStatus.ACTIVE,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
}

export async function listEnrollmentsForUser(userId: string): Promise<LearnerEnrollmentRecord[]> {
  const rows = await prisma.enrollment.findMany({
    where: {
      userId,
      deletedAt: null,
      courseVersion: {
        course: {
          deletedAt: null,
          status: CourseStatus.PUBLISHED,
        },
      },
    },
    include: enrollmentInclude,
    orderBy: { enrolledAt: 'desc' },
  });

  return rows
    .map(mapDbEnrollment)
    .filter((enrollment) => enrollment.status !== 'archived' && enrollment.status !== 'revoked');
}

export async function listEnrollmentsByCourseId(courseId: string): Promise<AdminEnrollmentRecord[]> {
  const rows = await prisma.enrollment.findMany({
    where: {
      deletedAt: null,
      courseVersion: { courseId },
    },
    include: enrollmentInclude,
    orderBy: { enrolledAt: 'desc' },
  });

  return rows.map((row) => {
    const enrollment = mapDbEnrollment(row);
    return {
      ...enrollment,
      learnerEmail: row.user.email,
      learnerName: formatLearnerName(row.user.firstName, row.user.lastName, row.user.email),
    };
  });
}

export async function listEnrollmentsByUserId(userId: string): Promise<AdminEnrollmentRecord[]> {
  const rows = await prisma.enrollment.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    include: enrollmentInclude,
    orderBy: { enrolledAt: 'desc' },
  });

  return rows.map((row) => {
    const enrollment = mapDbEnrollment(row);
    return {
      ...enrollment,
      learnerEmail: row.user.email,
      learnerName: formatLearnerName(row.user.firstName, row.user.lastName, row.user.email),
    };
  });
}

export async function listEnrollmentsByLearnerEmail(
  email: string,
): Promise<AdminEnrollmentRecord[]> {
  const learner = await findLearnerUserByEmail(email);
  if (!learner) {
    return [];
  }

  return listEnrollmentsByUserId(learner.id);
}

export async function getEnrollmentForUserCourseSlug(
  userId: string,
  courseSlug: string,
): Promise<LearnerEnrollmentRecord | undefined> {
  const row = await prisma.enrollment.findFirst({
    where: {
      userId,
      deletedAt: null,
      courseVersion: {
        course: {
          slug: courseSlug,
          deletedAt: null,
        },
      },
    },
    include: enrollmentInclude,
    orderBy: { enrolledAt: 'desc' },
  });

  return row ? mapDbEnrollment(row) : undefined;
}

export async function getEnrollmentForUserCourse(
  userId: string,
  courseId: string,
): Promise<LearnerEnrollmentRecord | undefined> {
  const row = await prisma.enrollment.findFirst({
    where: {
      userId,
      deletedAt: null,
      courseVersion: {
        courseId,
        course: { deletedAt: null },
      },
    },
    include: enrollmentInclude,
    orderBy: { enrolledAt: 'desc' },
  });

  return row ? mapDbEnrollment(row) : undefined;
}

export function enrollmentAllowsCourseAccess(status: LearnerEnrollmentStatus): boolean {
  return status === 'active' || status === 'completed';
}

export function enrollmentRequiresReset(status: LearnerEnrollmentStatus): boolean {
  return status === 'requires_reset' || status === 'requires_repurchase';
}

/** @deprecated Use enrollmentRequiresReset */
export function enrollmentRequiresRepurchase(status: LearnerEnrollmentStatus): boolean {
  return enrollmentRequiresReset(status);
}

export async function createEnrollment(input: CreateEnrollmentInput): Promise<LearnerEnrollmentRecord> {
  const tenantId = await getTenantId();

  const course = await prisma.course.findFirst({
    where: {
      tenantId,
      slug: input.courseSlug,
      deletedAt: null,
      status: CourseStatus.PUBLISHED,
    },
    include: {
      versions: {
        where: {
          deletedAt: null,
          status: CourseVersionStatus.PUBLISHED,
        },
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
  });

  if (!course) {
    throw new Error('Course is not available for enrollment.');
  }

  const catalogData = parseCatalogData(course.catalogData);
  if (catalogData.active === false) {
    throw new Error('Course is not active in the learner catalog.');
  }

  const source = input.source ?? 'free';

  if (courseRequiresCheckout(course.catalogData) && source !== 'admin' && source !== 'checkout') {
    throw new Error('This course requires checkout before enrollment.');
  }

  if (source === 'checkout') {
    if (!input.orderId) {
      throw new Error('Paid enrollment requires a completed order.');
    }

    const order = await getOrderForUser(input.orderId, input.userId);
    if (!order || order.status !== 'PAID') {
      throw new Error('Payment must be completed before enrollment.');
    }

    const lineItem = order.lineItems.find((item) => item.courseId === course.id);
    if (!lineItem) {
      throw new Error('Order does not include this course.');
    }
  }

  const courseVersion = course.versions[0];
  if (!courseVersion) {
    throw new Error('Published course version not found.');
  }

  const existing = await prisma.enrollment.findFirst({
    where: {
      userId: input.userId,
      courseVersionId: courseVersion.id,
      deletedAt: null,
    },
    include: enrollmentInclude,
  });

  if (existing) {
    const mapped = mapDbEnrollment(existing);
    if (enrollmentAllowsCourseAccess(mapped.status)) {
      return mapped;
    }
    throw new Error('A prior enrollment for this course is no longer active.');
  }

  const now = new Date();
  const metadata: Record<string, unknown> = { progressPercent: 0 };
  if (input.orderId) {
    metadata.orderId = input.orderId;
  }

  const row = await prisma.enrollment.create({
    data: {
      tenantId,
      userId: input.userId,
      courseVersionId: courseVersion.id,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: now,
      startedAt: now,
      metadata: metadata as Prisma.InputJsonValue,
    },
    include: enrollmentInclude,
  });

  return mapDbEnrollment(row);
}

export async function createAdminEnrollment(input: {
  learnerEmail: string;
  courseSlug: string;
}): Promise<LearnerEnrollmentRecord> {
  const learner = await findLearnerUserByEmail(input.learnerEmail);
  if (!learner) {
    throw new Error(`Learner not found for email "${input.learnerEmail}".`);
  }

  return createEnrollment({
    userId: learner.id,
    courseSlug: input.courseSlug,
    source: 'admin',
  });
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  progressPercent: number,
): Promise<LearnerEnrollmentRecord> {
  const row = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: enrollmentInclude,
  });

  if (!row || row.deletedAt) {
    throw new Error('Enrollment not found.');
  }

  const metadata = parseEnrollmentMetadata(row.metadata);
  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      metadata: {
        ...metadata,
        progressPercent,
      },
    },
    include: enrollmentInclude,
  });

  return mapDbEnrollment(updated);
}
