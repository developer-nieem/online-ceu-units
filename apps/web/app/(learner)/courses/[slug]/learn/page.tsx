import { redirect } from 'next/navigation';

import { getEnrollmentForCourse } from '@/lib/enrollment-server';
import { getPlayerState } from '@/lib/player-server';

export default async function CourseLearnIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const enrollmentStatus = await getEnrollmentForCourse(slug);

  if (!enrollmentStatus?.enrollment?.canAccessLearn) {
    redirect(`/courses/${slug}`);
  }

  const resume =
    enrollmentStatus.enrollment.resumeLessonSlug ??
    (await getPlayerState(slug))?.enrollment.resumeLessonSlug;

  if (resume) {
    redirect(`/courses/${slug}/learn/${resume}`);
  }

  redirect(`/courses/${slug}`);
}
