'use client';

import Link from 'next/link';

import { courseActionLabel } from '@/components/learner/course-price-display';
import { EnrollButton } from '@/components/learner/enroll-button';
import type { LearnerCourseView } from '@/lib/cms/catalog';
import { buildCheckoutPath } from '@/lib/checkout-path';
import { courseLearnPath } from '@/lib/learner/course-routes';
import { requiresCheckout } from '@/lib/checkout/pricing';

export function CourseAccessActions({
  course,
  isSignedIn,
}: {
  course: LearnerCourseView;
  isSignedIn: boolean;
}) {
  if (course.enrollmentStatus === 'requires_reset' || course.enrollmentStatus === 'requires_repurchase') {
    return (
      <Link
        className="inline-flex h-10 items-center rounded-md bg-amber-700 px-4 text-sm font-medium text-white hover:bg-amber-800"
        href={`/courses/${course.slug}/exam`}
      >
        Restart course
      </Link>
    );
  }

  if (course.enrollmentStatus === 'active') {
    return (
      <Link
        className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        href={courseLearnPath(course.slug)}
      >
        Continue course
      </Link>
    );
  }

  if (course.enrollmentStatus === 'completed') {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          href={courseLearnPath(course.slug)}
        >
          Review course
        </Link>
        <Link
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
          href="/certificates"
        >
          View certificate
        </Link>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Link
        className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        href={`/login?next=/courses/${course.slug}`}
      >
        Sign in to enroll
      </Link>
    );
  }

  return requiresCheckout(course.pricing) ? (
    <Link
      className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
      href={buildCheckoutPath('single', course.slug, course.title)}
    >
      {courseActionLabel(course.pricing)}
    </Link>
  ) : (
    <EnrollButton
      className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      courseSlug={course.slug}
      label={courseActionLabel(course.pricing)}
    />
  );
}
