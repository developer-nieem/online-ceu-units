import Link from 'next/link';

import { PortalPage, PortalPanel } from '@/components/learner/portal-page';
import { courseLearnPath } from '@/lib/learner/course-routes';
import type { LearnerCourseView } from '@/lib/cms/catalog';

export function ContinueLearningSection({ courses }: { courses: LearnerCourseView[] }) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Continue learning</h2>
          <p className="mt-1 text-sm text-slate-600">Pick up where you left off in your active enrollments.</p>
        </div>
        <Link
          className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
          href="/courses/active"
        >
          View all active
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        {courses.map((course) => (
          <li key={course.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{course.title}</p>
                <p className="text-sm text-slate-600">
                  {course.progressPercent ?? 0}% complete · {course.ceUnits} CE Unit
                </p>
              </div>
              <Link
                className="inline-flex h-9 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                href={courseLearnPath(course.slug)}
              >
                Continue
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EnrolledCoursesSummary({
  activeCount,
  completedCount,
  ceUnitsEarned,
}: {
  activeCount: number;
  completedCount: number;
  ceUnitsEarned: number;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Active courses</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{activeCount}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Completed courses</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{completedCount}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Online CE Units earned</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{ceUnitsEarned}</dd>
      </div>
    </dl>
  );
}

export function RestrictedCourseAccess({
  reason,
  courseSlug,
}: {
  reason: 'not_enrolled' | 'enrollment_inactive' | 'course_unavailable';
  courseSlug?: string;
}) {
  const message =
    reason === 'not_enrolled'
      ? 'You are not enrolled in this course.'
      : reason === 'enrollment_inactive'
        ? 'Your enrollment for this course is no longer active.'
        : 'This course is not available.';

  return (
    <PortalPage backHref="/courses" backLabel="Back to catalog" title="Course access restricted">
      <PortalPanel>
        <p className="text-sm text-slate-700">{message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {courseSlug ? (
            <Link
              className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              href={`/courses/${courseSlug}`}
            >
              View course details
            </Link>
          ) : null}
          <Link
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
            href="/courses"
          >
            Browse catalog
          </Link>
        </div>
      </PortalPanel>
    </PortalPage>
  );
}
