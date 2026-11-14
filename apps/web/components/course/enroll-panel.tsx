'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Progress } from '@calace/ui/components/ui/progress';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CheckoutDialog } from '@/components/enrollment/checkout-dialog';
import { CourseRestartButton } from '@/components/assessment/course-restart-button';
import { EnrollmentStatusBadge } from '@/components/enrollment/enrollment-status-badge';
import { EnrollButton } from '@/components/learner/enroll-button';
import type { CourseDetail } from '@/lib/course-detail';
import { enrollInCourse, type CourseEnrollmentStatus } from '@/lib/enrollment';
import { formatPrice } from '@/lib/pricing';

export function EnrollPanel({
  course,
  enrollmentStatus,
}: {
  course: CourseDetail;
  enrollmentStatus: CourseEnrollmentStatus;
}) {
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const { enrollment, learnerState, hasActiveSubscription } = enrollmentStatus;
  const isFree = course.isFree;
  const examUnlocked =
    enrollmentStatus.totalLessons > 0 &&
    (enrollment?.completedLessons ?? 0) >= enrollmentStatus.totalLessons;
  const examLockReason = 'Complete all course lessons to unlock the final exam';

  async function handleUnlimitedEnroll() {
    setEnrolling(true);
    setEnrollError(null);
    const result = await enrollInCourse(course.slug, 'single');
    setEnrolling(false);
    if (result.error) {
      setEnrollError(result.error);
      return;
    }
    router.push(`/courses/${course.slug}/learn`);
    router.refresh();
  }

  const showReset =
    learnerState === 'requires_reset' ||
    Boolean(enrollment?.requiresReset || enrollment?.requiresRepurchase);
  let mobileCtaRows = 0;
  if (learnerState === 'not_enrolled') {
    if (course.hasFreePreview) mobileCtaRows += 1;
    mobileCtaRows += 1;
  }
  if (learnerState === 'enrolled' || learnerState === 'in_progress') mobileCtaRows += 2;
  if (showReset) mobileCtaRows += 2;
  if (learnerState === 'completed') mobileCtaRows += 3;
  if (enrollError) mobileCtaRows += 1;
  const mobileCtaSpacer =
    mobileCtaRows > 0
      ? `calc(0.75rem + ${mobileCtaRows} * 2.5rem + ${Math.max(0, mobileCtaRows - 1)} * 0.5rem + max(0.75rem, env(safe-area-inset-bottom)) + 1px)`
      : undefined;

  function renderFinalExamButton() {
    if (examUnlocked) {
      return (
        <Button asChild variant="outline">
          <Link href={`/courses/${course.slug}/exam`}>Final exam</Link>
        </Button>
      );
    }
    return (
      <Button variant="outline" disabled title={examLockReason} aria-label={examLockReason}>
        <Lock className="mr-2 h-4 w-4" aria-hidden />
        Final exam
      </Button>
    );
  }

  return (
    <>
    <div
      className={`space-y-4 rounded-xl border p-5 shadow-sm lg:sticky lg:top-6 ${
        isFree ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/70 to-white' : 'bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {isFree ? (
          <div>
            <p className="text-2xl font-bold text-amber-800">Free</p>
            <p className="text-xs text-muted-foreground">Full course &amp; certificate included</p>
          </div>
        ) : (
          <p className="text-2xl font-bold text-teal-800">{formatPrice(course.price)}</p>
        )}
        <EnrollmentStatusBadge state={learnerState} />
      </div>

      {course.subscriptionEligible && !isFree ? (
        <p className="text-xs text-muted-foreground">
          Eligible for 1-year or 2-year unlimited plans
        </p>
      ) : null}

      {enrollment && enrollment.progressPct > 0 && enrollment.progressPct < 100 ? (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(enrollment.progressPct)}%</span>
          </div>
          <Progress value={enrollment.progressPct} />
        </div>
      ) : null}

      {showReset ? (
        <p className="text-sm text-amber-900">
          Exam locked after {enrollment?.maxAttempts ?? 3} attempts. Restart this course from the
          beginning or choose another course. Your unlimited access stays active.
        </p>
      ) : null}

      <div
        className="flex flex-col gap-2 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:border-t max-lg:border-slate-200 max-lg:bg-white max-lg:px-4 max-lg:pt-3 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:shadow-[0_-6px_16px_rgba(15,23,42,0.08)] max-lg:[&_a]:w-full max-lg:[&_button]:w-full"
      >
        {enrollError ? (
          <p className="text-sm text-red-600" role="alert">
            {enrollError}
          </p>
        ) : null}
        {learnerState === 'not_enrolled' ? (
          <>
            {course.hasFreePreview ? (
              <Button variant="outline" disabled title="Preview player coming soon">
                Start free preview
              </Button>
            ) : null}
            {isFree ? (
              <EnrollButton
                courseSlug={course.slug}
                label="Start for Free"
                redirectTo={`/courses/${course.slug}/learn`}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
              />
            ) : hasActiveSubscription ? (
              <Button type="button" disabled={enrolling} onClick={() => void handleUnlimitedEnroll()}>
                {enrolling ? 'Enrolling…' : 'Start course'}
              </Button>
            ) : (
              <Button type="button" onClick={() => setCheckoutOpen(true)}>
                Enroll now
              </Button>
            )}
          </>
        ) : null}

        {learnerState === 'enrolled' || learnerState === 'in_progress' ? (
          <>
            <Button asChild>
              <Link
                href={
                  enrollment?.resumeLessonSlug
                    ? `/courses/${course.slug}/learn/${enrollment.resumeLessonSlug}`
                    : `/courses/${course.slug}/learn`
                }
              >
                {learnerState === 'in_progress' ? 'Continue learning' : 'Continue'}
              </Link>
            </Button>
            {renderFinalExamButton()}
          </>
        ) : null}

        {showReset ? (
          <>
            <CourseRestartButton courseSlug={course.slug} />
            <Button asChild variant="outline">
              <Link href={`/courses/${course.slug}/exam`}>View exam status</Link>
            </Button>
          </>
        ) : null}

        {learnerState === 'completed' ? (
          <>
            <Button asChild variant="outline">
              <Link href={`/courses/${course.slug}/learn`}>Review course</Link>
            </Button>
            {renderFinalExamButton()}
            <Button asChild variant="outline">
              <Link href="/certificates">View certificates</Link>
            </Button>
          </>
        ) : null}
      </div>

      {!isFree ? (
        <CheckoutDialog
          course={course}
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          hasActiveSubscription={hasActiveSubscription}
        />
      ) : null}
    </div>
    {mobileCtaSpacer ? (
      <div aria-hidden className="lg:hidden" style={{ height: mobileCtaSpacer }} />
    ) : null}
    </>
  );
}
