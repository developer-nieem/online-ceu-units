import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CoursePlayer } from '@/components/player/course-player';
import { getEnrollmentForCourse } from '@/lib/enrollment-server';
import { getPlayerState } from '@/lib/player-server';

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;

  // CMS sometimes seeds gate lessons titled "Final Exam" — send learners to the real assessment.
  if (lessonSlug === 'final-exam' || lessonSlug === 'final-review') {
    redirect(`/courses/${slug}/exam`);
  }

  const enrollmentStatus = await getEnrollmentForCourse(slug);

  if (!enrollmentStatus?.enrollment?.canAccessLearn) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Enrollment required</h1>
        <p className="text-muted-foreground">
          You need to enroll before accessing course lessons.
        </p>
        <Link href={`/courses/${slug}`} className="font-medium text-teal-800 underline">
          View course & enroll
        </Link>
      </div>
    );
  }

  const playerState = await getPlayerState(slug, lessonSlug);
  if (!playerState) {
    redirect(`/courses/${slug}`);
  }

  return <CoursePlayer key={lessonSlug} initialState={playerState} lessonSlug={lessonSlug} />;
}
