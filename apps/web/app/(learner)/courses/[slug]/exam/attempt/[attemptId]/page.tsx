import { redirect } from 'next/navigation';

import { getEnrollmentForCourse } from '@/lib/enrollment-server';

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const { slug, attemptId } = await params;
  const enrollmentStatus = await getEnrollmentForCourse(slug);

  if (!enrollmentStatus?.enrollment?.canAccessLearn) {
    redirect(`/courses/${slug}`);
  }

  redirect(`/courses/${slug}/exam?resume=${attemptId}`);
}
