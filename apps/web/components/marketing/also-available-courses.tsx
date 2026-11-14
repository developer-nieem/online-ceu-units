import Link from 'next/link';

import type { CatalogCourse } from '@/lib/catalog';
import { formatOnlineCeuHours } from '@/lib/ceu-display';
import { formatPrice } from '@/lib/pricing';

export function AlsoAvailableCourses({
  courses,
  hrefForCourse,
}: {
  courses: CatalogCourse[];
  hrefForCourse: (course: CatalogCourse) => string;
}) {
  if (courses.length === 0) return null;

  return (
    <section className="mt-16 border-t border-slate-200 pt-12" aria-labelledby="also-available-heading">
      <div className="mx-auto max-w-2xl text-center sm:mx-0 sm:max-w-none sm:text-left">
        <h2 id="also-available-heading" className="text-lg font-semibold text-teal-900">
          Also available
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          More CE courses you can take once you have an account.
        </p>
      </div>

      <ul className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-slate-50/50">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={hrefForCourse(course)}
              className="group flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-white sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-teal-950 group-hover:text-teal-800">
                  {course.title}
                </span>
                {course.categoryName ? (
                  <span className="mt-0.5 block text-xs text-slate-500">{course.categoryName}</span>
                ) : null}
              </span>
              <span className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 sm:justify-end">
                <span>{formatOnlineCeuHours(course.ceHours)}</span>
                <span className="font-medium text-teal-800">{formatPrice(course.price)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
