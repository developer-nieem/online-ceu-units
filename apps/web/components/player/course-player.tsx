'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@calace/ui/components/ui/collapsible';
import { Progress } from '@calace/ui/components/ui/progress';
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  allRequiredBlocksComplete,
  isBlockDocument,
  moduleCompletionMessage,
} from '@calace/content-blocks';

import { useParticipationSession } from '@/hooks/use-participation-session';
import { completeLesson, type PlayerModule, type PlayerState } from '@/lib/player';
import { ParticipationMeter } from '@/components/participation/participation-meter';
import { ParticipationPrompt } from '@/components/participation/participation-prompt';
import { ActionToast } from './action-toast';
import { CourseRoadmap } from './course-roadmap';
import { LearningProgressMilestones } from './learning-progress-milestones';
import { LessonContentRenderer } from './lesson-content-renderer';
import { PlayerSidebar } from './player-sidebar';

const isDevelopment = process.env.NODE_ENV === 'development';

/** CMS gate lessons that the learn route redirects to the exam. Never a Back or Next target. */
const EXAM_GATE_LESSON_SLUGS = new Set(['final-exam', 'final-review']);

export function CoursePlayer({
  initialState,
  lessonSlug,
}: {
  initialState: PlayerState;
  lessonSlug: string;
}) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lessonCanComplete, setLessonCanComplete] = useState(true);
  const [lessonProgressPct, setLessonProgressPct] = useState(0);
  const [completionNote, setCompletionNote] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modules, setModules] = useState<PlayerModule[]>(initialState.modules);
  const [enrollment, setEnrollment] = useState(initialState.enrollment);
  const learning = initialState.learningExperience;

  useEffect(() => {
    setModules(initialState.modules);
    setEnrollment(initialState.enrollment);
  }, [initialState.modules, initialState.enrollment]);

  const current =
    modules
      .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug, moduleTitle: m.title })))
      .find((l) => l.slug === lessonSlug) ?? null;

  const {
    status: participationStatus,
    isPaused,
    tabVisible: participationTabVisible,
    documentFocused: participationDocumentFocused,
    devFastForward,
    bumpInteraction,
    setVideoPlaying,
    setAudioPlaying,
    refresh: refreshParticipation,
  } = useParticipationSession({
    courseSlug: initialState.course.slug,
    lessonId: current?.id,
    lessonSlug,
    initialStatus: initialState.participation,
    scrollRootRef: contentRef,
  });
  const [fastForwarding, setFastForwarding] = useState(false);

  const currentMeta =
    current ??
    (initialState.currentLesson?.slug === lessonSlug ? initialState.currentLesson : null);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const flat = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const lessonIndex = flat.findIndex((l) => l.slug === lessonSlug);
  const prevLesson =
    lessonIndex <= 0
      ? undefined
      : [...flat.slice(0, lessonIndex)]
          .reverse()
          .find((lesson) => !EXAM_GATE_LESSON_SLUGS.has(lesson.slug));
  const nextLesson =
    lessonIndex < 0
      ? undefined
      : flat
          .slice(lessonIndex + 1)
          .find((lesson) => !EXAM_GATE_LESSON_SLUGS.has(lesson.slug));

  async function handleComplete() {
    if (!current) return;
    setSaving(true);
    const result = await completeLesson(
      initialState.course.slug,
      lessonSlug,
      enrollment.id,
      current.id,
    );
    setSaving(false);

    if (result.error) {
      setToastMessage(result.error);
      return;
    }

    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) =>
          lesson.slug === lessonSlug
            ? {
                ...lesson,
                status: 'COMPLETED',
                progressPct: 100,
                completedAt: new Date().toISOString(),
              }
            : lesson,
        ),
      })),
    );

    const wasAlreadyCompleted = current.status === 'COMPLETED';
    if (!wasAlreadyCompleted) {
      setEnrollment((prev) => ({
        ...prev,
        completedLessons: prev.completedLessons + 1,
        progressPct: Math.min(
          100,
          Math.round(((prev.completedLessons + 1) / prev.totalLessons) * 100),
        ),
      }));
    }

    const moduleTitle = currentMeta?.moduleTitle ?? 'This';
    setCompletionNote(moduleCompletionMessage(moduleTitle, nextLesson?.title));
    void refreshParticipation();
    router.refresh();

    if (nextLesson && enrollment.progressPct < 100) {
      setTimeout(() => {
        router.push(`/courses/${initialState.course.slug}/learn/${nextLesson.slug}`);
      }, 1200);
    }
  }

  const displayLesson = current ?? null;
  const isBlockLesson = displayLesson ? isBlockDocument(displayLesson.content) : false;

  useEffect(() => {
    if (!displayLesson) return;
    setLessonProgressPct(displayLesson.progressPct);
    if (isBlockDocument(displayLesson.content)) {
      setLessonCanComplete(
        allRequiredBlocksComplete(
          displayLesson.content,
          displayLesson.blockProgress ?? { blocks: {} },
        ),
      );
    } else {
      setLessonCanComplete(true);
    }
  }, [lessonSlug, displayLesson?.id, displayLesson?.progressPct]);

  const completeDisabled =
    saving || current?.status === 'COMPLETED' || (isBlockLesson && !lessonCanComplete);

  const allLessonsComplete =
    enrollment.totalLessons > 0 && enrollment.completedLessons >= enrollment.totalLessons;
  const examUnlocked = allLessonsComplete;
  const examLockReason = !allLessonsComplete
    ? 'Complete all course lessons before the final exam'
    : !participationStatus?.examEligible
      ? 'Complete active participation time before starting the final exam (see exam page for progress)'
      : undefined;
  const hasProgressPanel =
    Boolean(learning?.milestones?.length) || Boolean(learning?.completionRoadmap?.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={mobileNav ? 'Close lesson menu' : 'Open lesson menu'}
          onClick={() => setMobileNav(!mobileNav)}
        >
          {mobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <p className="truncate text-sm font-medium">{initialState.course.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={mobileNav ? 'block' : 'hidden lg:block'}>
          <PlayerSidebar
            courseSlug={initialState.course.slug}
            modules={modules}
            activeLessonSlug={lessonSlug}
            onNavigate={() => setMobileNav(false)}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {currentMeta?.moduleTitle ?? 'Course player'}
            </p>
            <h1 className="text-2xl font-semibold">{displayLesson?.title ?? 'Lesson'}</h1>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {enrollment.completedLessons} of {enrollment.totalLessons} lessons
                {initialState.course.estimatedActiveMinutes
                  ? ` · ~${initialState.course.estimatedActiveMinutes} min active`
                  : ''}
              </span>
              <span>{Math.round(enrollment.progressPct)}%</span>
            </div>
            <Progress value={enrollment.progressPct} aria-label="Course progress" />
          </div>

          {completionNote ? (
            <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
              {completionNote}
            </p>
          ) : null}

          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="border-b bg-teal-50/50 pb-4">
              <CardTitle className="text-base">Lesson content</CardTitle>
            </CardHeader>
            <CardContent ref={contentRef} className="space-y-6 pt-6">
              {displayLesson ? (
                <LessonContentRenderer
                  lesson={displayLesson}
                  courseSlug={initialState.course.slug}
                  lessonSlug={lessonSlug}
                  enrollmentId={enrollment.id}
                  onInteraction={bumpInteraction}
                  onVideoPlayingChange={setVideoPlaying}
                  onAudioPlayingChange={setAudioPlaying}
                  onLessonProgress={(pct, canComplete) => {
                    setLessonProgressPct(pct);
                    setLessonCanComplete(canComplete);
                  }}
                />
              ) : (
                <p className="text-muted-foreground">Lesson not found.</p>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                {prevLesson ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="lg:hidden"
                    onClick={() =>
                      router.push(
                        `/courses/${initialState.course.slug}/learn/${prevLesson.slug}`,
                      )
                    }
                  >
                    <ChevronLeft aria-hidden />
                    Back
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={completeDisabled}
                  onClick={() => void handleComplete()}
                  title={
                    isBlockLesson && !lessonCanComplete
                      ? 'Complete required blocks first'
                      : undefined
                  }
                >
                  {current?.status === 'COMPLETED'
                    ? 'Lesson completed'
                    : saving
                      ? 'Saving…'
                      : isBlockLesson && !lessonCanComplete
                        ? `Complete required sections (${Math.round(lessonProgressPct)}%)`
                        : 'Mark lesson complete'}
                </Button>
                {nextLesson ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="lg:hidden"
                    onClick={() =>
                      router.push(
                        `/courses/${initialState.course.slug}/learn/${nextLesson.slug}`,
                      )
                    }
                  >
                    Next
                    <ChevronRight aria-hidden />
                  </Button>
                ) : null}
                {examUnlocked ? (
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/courses/${initialState.course.slug}/exam`}>Final exam</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    title={examLockReason}
                  >
                    Final exam (locked)
                  </Button>
                )}
                <Button type="button" variant="outline" asChild>
                  <a href={`/courses/${initialState.course.slug}`}>Exit to overview</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <ParticipationMeter
            status={participationStatus}
            isPaused={isPaused}
            tabVisible={participationTabVisible}
            documentFocused={participationDocumentFocused}
          />

          {isDevelopment ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100"
              disabled={fastForwarding || participationStatus?.examEligible}
              onClick={() => {
                setFastForwarding(true);
                void devFastForward().finally(() => setFastForwarding(false));
              }}
            >
              {fastForwarding
                ? 'Fast-forwarding…'
                : participationStatus?.examEligible
                  ? '🛠️ DEV: Timer already met'
                  : '🛠️ DEV: Fast-Forward Timer'}
            </Button>
          ) : null}

          {isPaused ? (
            <ParticipationPrompt message="Active participation is paused because this tab is in the background, unfocused, or idle. Return to the lesson and continue reading or interacting to accrue time." />
          ) : null}

          {hasProgressPanel && learning ? (
            <Collapsible className="group rounded-lg border bg-white">
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-slate-900">
                <span>Course progress & roadmap</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 border-t px-4 pb-4 pt-3">
                {learning.milestones.length > 0 ? (
                  <LearningProgressMilestones
                    milestones={learning.milestones}
                    encouragement={learning.encouragement}
                  />
                ) : null}
                {learning.completionRoadmap?.length ? (
                  <CourseRoadmap
                    steps={learning.completionRoadmap}
                    courseSlug={initialState.course.slug}
                    progressPct={enrollment.progressPct}
                    participation={participationStatus ?? undefined}
                    examEligible={participationStatus?.examEligible}
                  />
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      </div>

      {toastMessage ? (
        <ActionToast message={toastMessage} variant="error" onDismiss={dismissToast} />
      ) : null}
    </div>
  );
}
