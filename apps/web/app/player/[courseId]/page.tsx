import { redirect } from 'next/navigation';

import { getCourseById } from '@/lib/cms/catalog';
import { courseLearnPath } from '@/lib/learner/course-routes';

/** Backward-compatible redirect from legacy player URLs to slug-based learn route. */
export default async function LegacyPlayerRedirectPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    redirect('/courses');
  }

  redirect(courseLearnPath(course.slug));
}
