import type { Metadata } from 'next';

import { IndividualCoursesStore } from '@/components/marketing/individual-courses-store';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { getCatalogCourses } from '@/lib/catalog-server';

export const metadata: Metadata = {
  title: 'Individual CE Courses | CAL ACE Nursing Academy',
  description:
    'Browse California CNA CE modules and purchase any course individually — $3.75 each. No account needed to browse.',
};

export default async function IndividualCoursesPage() {
  const allCourses = await getCatalogCourses();

  const purchasable = allCourses
    .filter(
      (course) =>
        course.status === 'PUBLISHED' && !course.isFree && course.price > 0,
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  const storeCourses = purchasable.map((course) => ({
    slug: course.slug,
    title: course.title,
    categoryName: course.categoryName,
    ceHours: course.ceHours,
    price: course.price,
  }));

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-teal-950 sm:text-4xl">
            Individual CE courses
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Browse our CE modules and purchase any course individually — $3.75 each. No account
            needed to browse.
          </p>
        </header>

        {storeCourses.length > 0 ? (
          <IndividualCoursesStore courses={storeCourses} />
        ) : (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Individual course purchasing is being finalized — check back soon.
          </p>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
