'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ParticipationMeter } from '@/components/participation/participation-meter';
import { ExamParticipationLock } from '@/components/participation/participation-prompt';

import { CertificateAttestation } from './certificate-attestation';
import { CourseRestartButton } from './course-restart-button';
import { ExamResult } from './exam-result';
import { ExamRunner } from './exam-runner';
import {
  acknowledgeParticipation,
  fetchFinalExamOverview,
  resumeFinalExamAttempt,
  startFinalExamAttempt,
  type FinalExamOverview,
  type StartAttemptResponse,
  type SubmitAttemptResponse,
  getOnlineCeEligibility,
} from '@/lib/assessments';

function examRequiresReset(eligibility: FinalExamOverview['eligibility']): boolean {
  return Boolean(
    eligibility.finalExam.requiresReset ?? eligibility.finalExam.requiresRepurchase,
  );
}

function examPrerequisitesMet(overview: FinalExamOverview): boolean {
  const { eligibility } = overview;
  const onlineCe = getOnlineCeEligibility(eligibility);
  return (
    !!eligibility.checks.lessonsComplete &&
    !!eligibility.checks.interactionsComplete &&
    !!eligibility.checks.seatTimeMet &&
    !!eligibility.checks.activeParticipationAck &&
    (onlineCe.interactionCount ?? 0) >= 1
  );
}

function examAttemptErrorMessage(status: number | undefined, error?: string): string {
  if (status === 401) {
    return 'Your session expired. Please sign in again, then retry.';
  }
  const lowered = error?.toLowerCase() ?? '';
  if (lowered.includes('timed out')) {
    return 'The exam request timed out. Please try again.';
  }
  if (status === 0 || lowered.includes('failed to fetch') || lowered.includes('network error')) {
    return 'Could not reach the exam service. Please try again.';
  }
  return error?.trim() || 'Could not load the exam. Please try again.';
}

function isAlreadyInProgressError(error?: string): boolean {
  return (error?.toLowerCase() ?? '').includes('already have an exam attempt in progress');
}

export function ExamHub({
  courseSlug,
  courseTitle,
  participantName,
  ceHours,
  initialOverview,
}: {
  courseSlug: string;
  courseTitle: string;
  participantName: string;
  ceHours: number;
  initialOverview: FinalExamOverview;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeAttemptId = searchParams.get('resume');

  const [overview, setOverview] = useState(initialOverview);
  const [activeAttempt, setActiveAttempt] = useState<StartAttemptResponse | null>(null);
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ackError, setAckError] = useState<string | null>(null);
  const resumeAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    setOverview(initialOverview);
  }, [initialOverview]);

  useEffect(() => {
    let cancelled = false;
    void fetchFinalExamOverview(courseSlug).then((res) => {
      if (!cancelled && res.data) {
        setOverview(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  const { eligibility, assessment, participation } = overview;
  const onlineCe = getOnlineCeEligibility(eligibility);

  const needsReset = examRequiresReset(eligibility);
  const showResumeExam =
    overview.canResumeAttempt && Boolean(overview.inProgressAttemptId);
  const showStartExam = overview.canStartAttempt;
  const showViewCertificate = eligibility.finalExam.passed;
  const showContinueLessons =
    !needsReset && !examPrerequisitesMet(overview) && !showResumeExam && !showStartExam;
  const hasExamAction =
    showResumeExam || showStartExam || showViewCertificate || showContinueLessons;

  async function handleAckParticipation() {
    setLoading(true);
    setAckError(null);
    const res = await acknowledgeParticipation(courseSlug);
    if (res.error) {
      setLoading(false);
      setAckError(res.error);
      return;
    }
    const refreshed = await fetchFinalExamOverview(courseSlug);
    setLoading(false);
    if (refreshed.data) {
      setOverview(refreshed.data);
    } else if (refreshed.error) {
      setAckError(refreshed.error);
      return;
    }
    router.refresh();
  }

  const runResume = useCallback(async (): Promise<boolean> => {
    const res = await resumeFinalExamAttempt(courseSlug);
    if (res.error) {
      setError(examAttemptErrorMessage(res.status, res.error));
      return false;
    }
    if (res.data) {
      setResult(null);
      setActiveAttempt(res.data);
      return true;
    }
    return false;
  }, [courseSlug]);

  const handleResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await runResume();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(examAttemptErrorMessage(undefined, message));
    } finally {
      setLoading(false);
    }
  }, [runResume]);

  const handleStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startFinalExamAttempt(courseSlug);
      if (res.error) {
        if (isAlreadyInProgressError(res.error)) {
          // Recover once: pick up the existing attempt instead of looping on start.
          const recovered = await runResume();
          if (!recovered) {
            const refreshed = await fetchFinalExamOverview(courseSlug);
            if (refreshed.data) {
              setOverview(refreshed.data);
            }
          }
          return;
        }
        setError(examAttemptErrorMessage(res.status, res.error));
        return;
      }
      if (res.data) {
        setResult(null);
        setActiveAttempt(res.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(examAttemptErrorMessage(undefined, message));
    } finally {
      setLoading(false);
    }
  }, [courseSlug, runResume]);

  useEffect(() => {
    if (
      !resumeAttemptId ||
      !overview.canResumeAttempt ||
      overview.inProgressAttemptId !== resumeAttemptId ||
      activeAttempt ||
      result
    ) {
      return;
    }
    if (resumeAttemptedRef.current === resumeAttemptId) {
      return;
    }
    resumeAttemptedRef.current = resumeAttemptId;
    void handleResume();
  }, [
    resumeAttemptId,
    overview.canResumeAttempt,
    overview.inProgressAttemptId,
    activeAttempt,
    result,
    handleResume,
  ]);

  function handleSubmitted(submitResult: SubmitAttemptResponse) {
    setActiveAttempt(null);
    setResult(submitResult);
    router.refresh();
  }

  if (result) {
    const needsAttestation =
      result.passed &&
      result.requiresCertificateAttestation &&
      !eligibility.checks.certificateAttestation;

    const resultNeedsReset = Boolean(result.requiresReset ?? result.requiresRepurchase);

    return (
      <div className="space-y-6">
        <ExamResult
          result={result}
          courseSlug={courseSlug}
          locked={eligibility.finalExam.locked || resultNeedsReset}
          onRetry={
            overview.canStartAttempt && !result.passed && !resultNeedsReset
              ? () => {
                  setResult(null);
                  void handleStart();
                }
              : undefined
          }
        />
        {needsAttestation && result.attestationText ? (
          <CertificateAttestation
            courseSlug={courseSlug}
            courseTitle={courseTitle}
            participantName={participantName}
            ceHours={ceHours}
            attestationText={result.attestationText}
            participation={participation}
            seatTimeMinutes={onlineCe.seatTimeMinutes}
            requiredSeatTimeMinutes={onlineCe.requiredSeatTimeMinutes}
            seatTimeMet={onlineCe.seatTimeMet}
            onCompleted={() => router.refresh()}
          />
        ) : null}
      </div>
    );
  }

  if (activeAttempt) {
    return (
      <ExamRunner
        attemptId={activeAttempt.attemptId}
        passingScore={activeAttempt.passingScore}
        questions={activeAttempt.questions}
        initialAnswers={activeAttempt.savedAnswers}
        onSubmitted={handleSubmitted}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{courseTitle}</p>
        <h1 className="text-2xl font-semibold">{assessment.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {assessment.questionsPerAttempt} questions per attempt · Pass {assessment.passingScore}%
          · Max {assessment.maxAttempts} attempts · Questions and options shuffle each attempt
        </p>
      </div>

      {participation ? (
        <ParticipationMeter status={participation} />
      ) : null}

      <ExamParticipationLock
        activeMinutes={participation?.activeMinutes ?? onlineCe.seatTimeMinutes}
        requiredMinutes={participation?.requiredMinutes ?? onlineCe.requiredSeatTimeMinutes}
        remainingMinutes={participation?.remainingMinutes}
        examEligible={participation?.examEligible ?? eligibility.checks.seatTimeMet}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion requirements</CardTitle>
          <CardDescription>All checks must pass before certificate issuance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Check ok={!!eligibility.checks.enrolled} label="Enrolled in course" />
          <Check
            ok={!!eligibility.checks.lessonsComplete}
            label={`Lessons complete (${eligibility.lessonProgress.completed}/${eligibility.lessonProgress.total})`}
          />
          <Check ok={!!eligibility.checks.interactionsComplete} label="Required interactions done" />
          <Check
            ok={!!eligibility.checks.seatTimeMet}
            label={`Active seat time (${onlineCe.seatTimeMinutes}/${onlineCe.requiredSeatTimeMinutes} min)`}
          />
          <Check
            ok={!!eligibility.checks.activeParticipationAck}
            label="Active participation acknowledged"
          />
          <Check ok={!!eligibility.checks.finalExamPassed} label="Final exam passed" />
          <Check
            ok={!!eligibility.checks.certificateAttestation}
            label="Learner attestation (certificate release)"
          />
        </CardContent>
      </Card>

      {!eligibility.checks.activeParticipationAck ? (
        <Card className="border-dashed">
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm">
              Confirm you participated actively in this online course (not passive-only viewing).
            </p>
            {ackError ? <p className="text-sm text-red-600">{ackError}</p> : null}
            <Button type="button" disabled={loading} onClick={() => void handleAckParticipation()}>
              {loading ? 'Saving…' : 'Acknowledge active participation'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {needsReset ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="space-y-4 pt-6 text-sm text-amber-950">
            <p className="font-medium">
              Exam locked after 3 attempts. You must restart this course from the beginning or
              choose a new course.
            </p>
            <p className="text-amber-900/80">
              Restarting wipes your lesson progress and seat-time for this course, returns you to
              Lesson 1, and resets your attempt counter. Your unlimited subscription access stays
              active.
            </p>
            <div className="flex flex-wrap gap-2">
              <CourseRestartButton courseSlug={courseSlug} />
              <Button asChild variant="outline">
                <Link href="/courses">Browse other courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : eligibility.finalExam.locked ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-900">
            You have used all {assessment.maxAttempts} exam attempts without passing. Restart the
            course to try again.
          </CardContent>
        </Card>
      ) : null}

      {overview.attempts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attempt history</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {overview.attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0"
                >
                  <span>
                    Attempt {a.attemptNum} — {a.status}
                  </span>
                  <span>
                    {a.score !== null ? `${a.score}%` : 'In progress'}
                    {a.passed ? ' · Passed' : ''}
                  </span>
                </li>
              ))}
            </ul>
            {eligibility.finalExam.bestScore !== null ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Best score: {eligibility.finalExam.bestScore}%
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {hasExamAction ? (
        <div className="flex flex-wrap gap-2">
          {showResumeExam ? (
            loading ? (
              <Button disabled>Loading…</Button>
            ) : error ? (
              <Button type="button" onClick={() => void handleResume()}>
                Retry
              </Button>
            ) : (
              <Button asChild>
                <Link
                  href={`/courses/${courseSlug}/exam/attempt/${overview.inProgressAttemptId}`}
                >
                  Resume Exam
                </Link>
              </Button>
            )
          ) : showStartExam ? (
            <Button type="button" disabled={loading} onClick={() => void handleStart()}>
              {loading ? 'Starting…' : error ? 'Retry' : 'Start final exam'}
            </Button>
          ) : showViewCertificate ? (
            <Button asChild>
              <Link href="/certificates">View certificate</Link>
            </Button>
          ) : showContinueLessons ? (
            <Button asChild variant="outline">
              <Link href={`/courses/${courseSlug}/learn`}>Continue lessons</Link>
            </Button>
          ) : null}
          {!loading && error?.includes('session expired') ? (
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {eligibility.finalExam.passed && !eligibility.checks.certificateAttestation ? (
        <CertificateAttestation
          courseSlug={courseSlug}
          courseTitle={courseTitle}
          participantName={participantName}
          ceHours={ceHours}
          attestationText={onlineCe.attestationText}
          participation={participation}
          seatTimeMinutes={onlineCe.seatTimeMinutes}
          requiredSeatTimeMinutes={onlineCe.requiredSeatTimeMinutes}
          seatTimeMet={onlineCe.seatTimeMet}
          onCompleted={() => router.refresh()}
        />
      ) : null}

      {!eligibility.eligible && eligibility.reasons.length > 0 ? (
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {eligibility.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
          ok ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
        }`}
        aria-hidden
      >
        {ok ? '✓' : '·'}
      </span>
      <span>{label}</span>
    </div>
  );
}
