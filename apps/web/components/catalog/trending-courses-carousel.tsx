'use client';

import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import type { TrendingCourse } from '@/lib/catalog-insights';
import { formatOnlineCeuHours } from '@/lib/ceu-display';

export function TrendingCoursesCarousel({ courses }: { courses: TrendingCourse[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 'left' | 'right') {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = direction === 'left' ? -280 : 280;
    node.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (courses.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-teal-700" aria-hidden />
            Most enrolled courses
          </h2>
          <p className="text-sm text-muted-foreground">
            Paid catalog highlights — free starter courses excluded
          </p>
        </div>
        <div className="flex gap-1 print:hidden">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-muted"
            onClick={() => scrollByCard('left')}
            aria-label="Scroll trending courses left"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-muted"
            onClick={() => scrollByCard('right')}
            aria-label="Scroll trending courses right"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course, index) => (
          <article
            key={course.id}
            className="w-[260px] shrink-0 rounded-lg border bg-card p-4 shadow-sm transition hover:border-teal-300"
          >
            <p className="text-xs font-medium text-teal-700">#{index + 1} most enrolled</p>
            <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{course.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{course.categoryName}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">CEU</dt>
                <dd className="font-medium">{formatOnlineCeuHours(course.ceHours)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Enrollments</dt>
                <dd className="font-medium tabular-nums">{course.accessCount}</dd>
              </div>
            </dl>
            <Link
              href={`/courses/${course.slug}`}
              className="mt-4 inline-flex text-sm font-medium text-teal-800 hover:underline"
            >
              View course →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
