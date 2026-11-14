'use client';

import Link from 'next/link';
import * as React from 'react';

import { EnrollButton } from '@/components/learner/enroll-button';
import { courseActionLabel, CoursePriceDisplay } from '@/components/learner/course-price-display';
import type { LearnerCourseView } from '@/lib/cms/catalog';
import { buildCheckoutPath } from '@/lib/checkout-path';
import { courseLearnPath } from '@/lib/learner/course-routes';
import { requiresCheckout } from '@/lib/checkout/pricing';

export function CourseCatalog({
  courses,
  showEnrollment = false,
  isSignedIn = false,
}: {
  courses: LearnerCourseView[];
  showEnrollment?: boolean;
  isSignedIn?: boolean;
}) {
  const [category, setCategory] = React.useState('All');

  const categories = React.useMemo(() => {
    const set = new Set(courses.map((course) => course.category));
    return ['All', ...Array.from(set).sort()];
  }, [courses]);

  const filtered =
    category === 'All' ? courses : courses.filter((course) => course.category === category);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === item
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
            onClick={() => setCategory(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600">No courses match this category.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isSignedIn={isSignedIn}
              showEnrollment={showEnrollment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  showEnrollment,
  isSignedIn,
}: {
  course: LearnerCourseView;
  showEnrollment?: boolean;
  isSignedIn?: boolean;
}) {
  const continueHref =
    course.enrollmentStatus === 'active'
      ? courseLearnPath(course.slug)
      : `/courses/${course.slug}`;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          Online
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {course.ceUnits} CE Unit
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {course.category}
        </span>
      </div>

      <h2 className="text-lg font-semibold leading-snug text-slate-900">{course.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{course.shortDescription}</p>

      <p className="mt-3 text-xs text-slate-500">
        ~{course.estimatedSeatTimeMinutes} min · {course.instructor}
      </p>

      <div className="mt-2">
        <CoursePriceDisplay pricing={course.pricing} size="sm" />
      </div>

      {showEnrollment && course.enrollmentStatus === 'active' ? (
        <p className="mt-2 text-xs font-medium text-blue-700">
          In progress · {course.progressPercent ?? 0}% complete
        </p>
      ) : null}
      {showEnrollment && course.enrollmentStatus === 'completed' ? (
        <p className="mt-2 text-xs font-medium text-emerald-700">Completed</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="inline-flex h-9 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          href={continueHref}
        >
          {course.enrollmentStatus === 'active' ? 'Continue' : 'View course'}
        </Link>
        {showEnrollment &&
        (course.enrollmentStatus === 'not_enrolled' || !course.enrollmentStatus) ? (
          isSignedIn ? (
            requiresCheckout(course.pricing) ? (
              <Link
                className="inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href={buildCheckoutPath('single', course.slug, course.title)}
              >
                {courseActionLabel(course.pricing)}
              </Link>
            ) : (
              <EnrollButton courseSlug={course.slug} label={courseActionLabel(course.pricing)} />
            )
          ) : (
            <Link
              className="inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href={`/login?next=/courses/${course.slug}`}
            >
              Sign in to enroll
            </Link>
          )
        ) : null}
      </div>
    </article>
  );
}
