'use client';

import { cn } from '@calace/ui/lib/utils';
import { CheckCircle, Circle, ClipboardCheck, PlayCircle } from 'lucide-react';
import Link from 'next/link';

import type { PlayerModule } from '@/lib/player';

const EXAM_GATE_LESSON_SLUGS = new Set(['final-exam', 'final-review']);

function LessonStatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return <CheckCircle className="h-4 w-4 fill-emerald-600 text-emerald-600" aria-label="Completed" />;
  }
  if (status === 'IN_PROGRESS') {
    return <PlayCircle className="h-4 w-4 text-teal-600" aria-label="In progress" />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground" aria-label="Not started" />;
}

function lessonHref(courseSlug: string, lessonSlug: string) {
  if (EXAM_GATE_LESSON_SLUGS.has(lessonSlug)) {
    return `/courses/${courseSlug}/exam`;
  }
  return `/courses/${courseSlug}/learn/${lessonSlug}`;
}

export function PlayerSidebar({
  courseSlug,
  modules,
  activeLessonSlug,
  onNavigate,
}: {
  courseSlug: string;
  modules: PlayerModule[];
  activeLessonSlug?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto rounded-xl border bg-white p-4 shadow-sm"
      aria-label="Course lessons"
    >
      <Link
        href={`/courses/${courseSlug}`}
        className="mb-4 block text-sm font-medium text-teal-800 underline"
        onClick={onNavigate}
      >
        ← Course overview
      </Link>

      {modules.map((mod, mi) => (
        <div key={mod.id} className="mb-4 last:mb-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Module {mi + 1}
          </p>
          <p className="mb-2 text-sm font-medium text-slate-900">{mod.title}</p>
          <ul className="space-y-0.5">
            {mod.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={lessonHref(courseSlug, lesson.slug)}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    activeLessonSlug === lesson.slug
                      ? 'bg-teal-100 font-medium text-teal-900'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <LessonStatusIcon status={lesson.status} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">{lesson.title}</span>
                    {lesson.durationMinutes ? (
                      <span className="block text-xs text-muted-foreground">
                        ~{lesson.durationMinutes} min active
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-4 border-t pt-4">
        <Link
          href={`/courses/${courseSlug}/exam`}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md bg-teal-50 px-2 py-2 text-sm font-medium text-teal-900 hover:bg-teal-100"
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
          Final exam
        </Link>
      </div>
    </nav>
  );
}
