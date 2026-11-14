'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import { CmsPreviewLessonContent } from '@/components/cms/preview/cms-preview-lesson-content';
import type { CmsCoursePreviewData } from '@/lib/cms/preview-data';
import { toPreviewPlayerLesson } from '@/lib/cms/preview-data';

export function CmsPreviewView({
  preview,
  lessonId,
}: {
  preview: CmsCoursePreviewData;
  lessonId: string;
}) {
  const flatLessons = preview.modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: mod.title,
    })),
  );
  const current = flatLessons.find((l) => l.id === lessonId);
  const playerLesson = current ? toPreviewPlayerLesson(current) : null;

  return (
    <div className="space-y-4">
      <div
        role="status"
        className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        <p className="font-semibold">
          CMS PREVIEW — DRAFT v{preview.versionNumber} — not visible to learners, interactions are
          not recorded
        </p>
        <p className="mt-1 text-amber-900">
          {preview.course.title} · version status {preview.versionStatus.toLowerCase()} · course{' '}
          {preview.course.status}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/cms/courses/${preview.course.id}`}
          className="text-sm font-medium text-teal-800 underline"
        >
          ← Back to course workspace
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Course lessons" className="space-y-3">
          {preview.modules.map((mod) => (
            <div key={mod.id} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {mod.title}
              </p>
              <ul className="space-y-1">
                {mod.lessons.map((lesson) => {
                  const active = lesson.id === lessonId;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/cms/courses/${preview.course.id}/preview/${lesson.id}`}
                        className={`block rounded-md px-2 py-1.5 text-sm ${
                          active
                            ? 'bg-teal-700 font-medium text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                        aria-current={active ? 'page' : undefined}
                      >
                        {lesson.title}
                        {lesson.status !== 'published' ? (
                          <span className="ml-1 text-xs opacity-80">({lesson.status})</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <Card className="border-teal-100 shadow-sm">
          {current && playerLesson ? (
            <>
              <CardHeader className="border-b bg-teal-50/50 pb-4">
                <p className="text-xs text-muted-foreground">{current.moduleTitle}</p>
                <CardTitle className="text-base">{current.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <CmsPreviewLessonContent lesson={playerLesson} courseSlug={preview.course.slug} />
              </CardContent>
            </>
          ) : (
            <CardContent className="py-8 text-sm text-muted-foreground">
              Select a lesson from the navigation, or add lessons in the course workspace.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
