import type { Metadata } from 'next';

import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { PageHeader } from '@/components/learner/page-header';
import { getCatalogInsights } from '@/lib/catalog-insights';
import { getCatalogCategories, getCatalogCourses } from '@/lib/catalog-server';
import { getMyEnrollments } from '@/lib/enrollment-server';

export const metadata: Metadata = {
  title: 'CNA CEU Course Catalog',
  description:
    'Browse CDPH-aligned online CNA continuing education courses. Start with three free courses, then unlock the full California renewal catalog.',
  alternates: {
    canonical: '/courses',
  },
};

export default async function CoursesPage() {
  const [courses, categories, enrollments, insights] = await Promise.all([
    getCatalogCourses(),
    getCatalogCategories(),
    getMyEnrollments(),
    getCatalogInsights(),
  ]);

  const enrollmentBySlug = Object.fromEntries(
    enrollments.map((e) => [e.courseSlug, e.learnerState]),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="CEU course catalog"
        description="California CNA continuing education courses. Start with three free courses, then explore the full catalog."
      />

      <CatalogBrowser
        courses={courses}
        categories={categories}
        enrollmentBySlug={enrollmentBySlug}
        trendingCourses={insights.trendingCourses}
        topCities={insights.topCities ?? []}
      />
    </div>
  );
}
