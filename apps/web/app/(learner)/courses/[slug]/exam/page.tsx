import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { ExamHub } from '@/components/assessment/exam-hub';
import { getEnrollmentForCourse } from '@/lib/enrollment-server';
import { getFinalExamOverview } from '@/lib/assessments-server';
import { getServerSession } from '@/lib/auth-server';
import { getCourseBySlug } from '@/lib/catalog-server';

export default async function FinalExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const enrollmentStatus = await getEnrollmentForCourse(slug);

  if (!enrollmentStatus?.enrollment?.canAccessLearn) {
    redirect(`/courses/${slug}`);
  }

  const [course, overview, session] = await Promise.all([
    getCourseBySlug(slug),
    getFinalExamOverview(slug),
    getServerSession(),
  ]);
  const user = session.data?.user;
  const participantName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    '';

  if (!overview) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border p-8 text-center">
        <h1 className="text-xl font-semibold">Final exam unavailable</h1>
        <p className="text-muted-foreground">
          This course does not have a final exam configured yet.
        </p>
        <Link href={`/courses/${slug}/learn`} className="text-teal-800 underline">
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading exam…</p>}>
        <ExamHub
          courseSlug={slug}
          courseTitle={course?.title ?? slug}
          participantName={participantName}
          ceHours={course?.ceHours ?? 1}
          initialOverview={overview}
        />
      </Suspense>
    </div>
  );
}
