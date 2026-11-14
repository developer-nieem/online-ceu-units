'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Input } from '@calace/ui/components/ui/input';
import { Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CourseCard } from './course-card';
import { PricingPlans } from './pricing-plans';
import { TrendingCoursesCarousel } from './trending-courses-carousel';
import type { CatalogCategory, CatalogCourse } from '@/lib/catalog';
import type { TrendingCourse } from '@/lib/catalog-insights';
import { filterCatalog } from '@/lib/catalog';
import { partitionCatalogCourses } from '@/lib/freemium';
import type { LearnerCourseState } from '@/lib/learner-state';

export function CatalogBrowser({
  courses,
  categories,
  enrollmentBySlug = {},
  trendingCourses = [],
  topCities = [],
}: {
  courses: CatalogCourse[];
  categories: CatalogCategory[];
  enrollmentBySlug?: Record<string, LearnerCourseState>;
  trendingCourses?: TrendingCourse[];
  topCities?: Array<{ city: string; count: number }>;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(
    () => filterCatalog(courses, { search, category }),
    [courses, search, category],
  );

  const { freeCourses, paidCourses } = useMemo(() => partitionCatalogCourses(filtered), [filtered]);
  const featured = paidCourses.filter((c) => c.featured);
  const showFreeSection = freeCourses.length > 0 && category === 'all' && !search;
  const mainCourses = showFreeSection ? paidCourses : filtered;
  const paidCourseCount = courses.filter((c) => !c.isFree).length;

  return (
    <div className="space-y-8">
      {showFreeSection ? (
        <section
          id="free"
          className="space-y-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-teal-50/40 to-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-teal-900">Start Learning for Free</h2>
              <p className="text-sm text-muted-foreground">
                Try three full courses at no cost — enroll, complete, and earn your certificate.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {freeCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                variant="free"
                learnerState={enrollmentBySlug[course.slug]}
              />
            ))}
          </div>
        </section>
      ) : null}

      <TrendingCoursesCarousel courses={trendingCourses} />

      {topCities.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Where CNAs Are Learning
          </h2>
          <div className="flex flex-wrap gap-2">
            {topCities.map(({ city, count }) => (
              <span
                key={city}
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-800"
              >
                {city} · {count} {count !== 1 ? 'learners' : 'learner'}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on learners who shared their city. No personal information is shown.
          </p>
        </section>
      ) : null}

      <PricingPlans compact paidCourseCount={paidCourseCount} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Find a course</h2>
          <Button variant="outline" size="sm" onClick={() => setCategory('all')}>
            All Categories
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Search courses, topics, instructors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search courses"
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name} ({cat.courseCount})
              </option>
            ))}
          </select>
        </div>
      </section>

      {featured.length > 0 && category === 'all' && !search ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Featured courses</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {mainCourses.length} course{mainCourses.length === 1 ? '' : 's'}
        </h2>
        {mainCourses.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No courses match your search. Try another category or keyword.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mainCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                learnerState={enrollmentBySlug[course.slug]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
