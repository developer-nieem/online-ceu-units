import { CourseStatus, CourseVersionStatus, prisma } from '@calace/db';

import { DEFAULT_TENANT_SLUG, parseCatalogData } from '@/lib/cms/db/mappers';
import { buildCheckoutPath } from '@/lib/checkout-path';
import {
  enrollmentAllowsCourseAccess,
  getEnrollmentForUserCourseSlug,
} from '@/lib/enrollment/repository';

import { getEffectivePriceCents, isFreeCourse, requiresCheckout } from './pricing';
import type { InitiateCheckoutResult } from './types';

async function getPublishedCourseForCheckout(courseSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error('Default tenant not found. Run `pnpm --filter @calace/db db:seed`.');
  }

  const course = await prisma.course.findFirst({
    where: {
      tenantId: tenant.id,
      slug: courseSlug,
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
    throw new Error('Course is not available for purchase.');
  }

  const catalog = parseCatalogData(course.catalogData);
  if (catalog.active === false) {
    throw new Error('Course is not active in the learner catalog.');
  }

  if (!course.versions[0]) {
    throw new Error('Published course version not found.');
  }

  return { course, catalog, courseVersionId: course.versions[0].id };
}

/**
 * Validates a single-course purchase and returns the native Elements checkout path.
 * All live and demo payments are completed on `/checkout` via Stripe Elements or mock checkout.
 */
export async function initiateCheckout(
  userId: string,
  courseSlug: string,
): Promise<InitiateCheckoutResult> {
  const existingEnrollment = await getEnrollmentForUserCourseSlug(userId, courseSlug);
  if (existingEnrollment && enrollmentAllowsCourseAccess(existingEnrollment.status)) {
    throw new Error('You are already enrolled in this course.');
  }

  const { course, catalog } = await getPublishedCourseForCheckout(courseSlug);
  const pricing = catalog.pricing;

  if (isFreeCourse(pricing) || !requiresCheckout(pricing)) {
    throw new Error('This course does not require checkout. Use Enroll instead.');
  }

  const amountCents = getEffectivePriceCents(pricing);
  if (amountCents <= 0) {
    throw new Error('Course price is not configured.');
  }

  return {
    checkoutPath: buildCheckoutPath('single', course.slug, course.title),
    amountCents,
    currency: 'USD',
  };
}
