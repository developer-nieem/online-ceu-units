import type { Metadata } from 'next';

import { AlsoAvailableCourses } from '@/components/marketing/also-available-courses';
import { FreeCourseCard } from '@/components/marketing/free-course-card';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { getServerSession } from '@/lib/auth-server';
import type { CatalogCourse } from '@/lib/catalog';
import { getCatalogCourses, getCourseBySlug } from '@/lib/catalog-server';

export const metadata: Metadata = {
  title: 'Start with Three Free Courses | CAL ACE Nursing Academy',
  description:
    'Full California CNA CE courses with certificates — no payment required. Create your account when you are ready to begin.',
};

function freeFunnelHref(slug: string, { loggedIn, freePlan }: { loggedIn: boolean; freePlan: boolean }) {
  if (loggedIn) return `/courses/${slug}`;
  const next = encodeURIComponent(`/courses/${slug}`);
  if (freePlan) return `/register?plan=free&next=${next}`;
  return `/register?next=${next}`;
}

export default async function FreeCoursesPage() {
  const [allCourses, session] = await Promise.all([getCatalogCourses(), getServerSession()]);
  const loggedIn = Boolean(session.data?.user);

  // Stable order by title (live free set is derived, not hardcoded).
  const featured = allCourses
    .filter((course) => course.status === 'PUBLISHED' && course.isFree)
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 3);

  const featuredSlugs = new Set(featured.map((c) => c.slug));
  const alsoAvailable = allCourses
    .filter((c) => c.status === 'PUBLISHED' && !featuredSlugs.has(c.slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  const courses = await Promise.all(
    featured.map(async (course) => {
      const detail = await getCourseBySlug(course.slug);
      return {
        slug: course.slug,
        title: detail?.title ?? course.title,
        summary: detail?.summary || course.summary,
        heroImage: detail?.heroImage ?? null,
        href: freeFunnelHref(course.slug, { loggedIn, freePlan: true }),
      };
    }),
  );

  function alsoAvailableHref(course: CatalogCourse) {
    return freeFunnelHref(course.slug, { loggedIn, freePlan: false });
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-teal-950 sm:text-4xl">
            Start with three free courses
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Full courses, real certificates, no payment required. Create your account when you are
            ready to begin.
          </p>
        </header>

        {courses.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <FreeCourseCard key={course.slug} {...course} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Free starter courses will appear here when they are published.
          </p>
        )}

        <AlsoAvailableCourses courses={alsoAvailable} hrefForCourse={alsoAvailableHref} />
      </main>

      <MarketingFooter />
    </div>
  );
}
