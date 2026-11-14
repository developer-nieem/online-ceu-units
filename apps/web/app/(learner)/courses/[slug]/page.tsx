import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CourseDetailContent } from '@/components/course/course-detail-content';
import { JsonLd } from '@/components/seo/json-ld';
import { getCourseBySlug } from '@/lib/catalog-server';
import type { CourseEnrollmentStatus } from '@/lib/enrollment';
import { getEnrollmentForCourse } from '@/lib/enrollment-server';
import { SITE_NAME, absoluteUrl } from '@/lib/seo';

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Course not found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${course.title} | CNA CE Course`;
  const description =
    course.summary?.trim() ||
    `${course.title} — ${course.ceHours} CE Unit online continuing education for California CNA renewal from ${SITE_NAME}.`;
  const canonicalPath = `/courses/${course.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      url: canonicalPath,
      title: course.title,
      description,
      siteName: SITE_NAME,
      images: course.heroImage
        ? [{ url: course.heroImage, alt: course.title }]
        : [{ url: '/og-cover.jpg', width: 1200, height: 630, alt: course.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description,
      images: course.heroImage ? [course.heroImage] : ['/og-cover.jpg'],
    },
  };
}

function courseStructuredData(course: NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>) {
  const url = absoluteUrl(`/courses/${course.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.summary || course.overview,
    url,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
    educationalLevel: course.difficulty,
    timeRequired: `PT${Math.max(1, course.durationMinutes)}M`,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `${course.ceHours} CE Unit`,
    },
    offers: {
      '@type': 'Offer',
      url,
      price: course.isFree ? '0' : String(course.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      category: course.isFree ? 'Free' : 'Paid',
    },
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const enrollmentStatus =
    (await getEnrollmentForCourse(slug)) ??
    ({
      courseSlug: slug,
      courseVersionId: course.courseVersionId ?? '',
      enrollment: null,
      learnerState: 'not_enrolled',
      progressPct: 0,
      totalLessons: course.modules.reduce((n, m) => n + m.lessons.length, 0),
      hasActiveSubscription: false,
      subscriptionPlanCode: null,
    } satisfies CourseEnrollmentStatus);

  return (
    <>
      <JsonLd data={courseStructuredData(course)} />
      <CourseDetailContent course={course} enrollmentStatus={enrollmentStatus} />
    </>
  );
}
