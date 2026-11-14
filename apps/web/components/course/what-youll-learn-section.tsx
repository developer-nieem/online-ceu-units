import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardContent } from '@calace/ui/components/ui/card';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  ListChecks,
} from 'lucide-react';

import type { CourseDetail } from '@/lib/course-detail';
import { formatCourseDurationMinutes, formatOnlineCeuHours } from '@/lib/ceu-display';

function buildCurriculumStats(course: CourseDetail) {
  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const moduleMinutes = course.modules.map((mod) =>
    mod.lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0),
  );
  const summedLessonMinutes = moduleMinutes.reduce((a, b) => a + b, 0);
  const estimatedMinutes =
    summedLessonMinutes > 0 ? summedLessonMinutes : course.durationMinutes;

  return { totalLessons, totalModules: course.modules.length, estimatedMinutes, moduleMinutes };
}

export function WhatYoullLearnSection({ course }: { course: CourseDetail }) {
  const { totalLessons, totalModules, estimatedMinutes, moduleMinutes } =
    buildCurriculumStats(course);
  const objectives =
    course.learningObjectives.length > 0
      ? course.learningObjectives
      : [
          'Apply course concepts in real CNA practice settings',
          'Meet California continuing education requirements',
          'Demonstrate competency through lesson activities and final exam',
        ];

  return (
    <section
      aria-labelledby="what-youll-learn-heading"
      className="overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 via-white to-emerald-50/40 shadow-sm"
    >
      <div className="border-b border-teal-100/80 bg-teal-900 px-6 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              Course curriculum
            </p>
            <h2 id="what-youll-learn-heading" className="mt-1 text-2xl font-semibold tracking-tight">
              What you&apos;ll learn
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-teal-100/90">
              A structured path from your first lesson through certificate-ready completion —
              designed for busy California CNAs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5 bg-white/15 text-white hover:bg-white/20">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatCourseDurationMinutes(estimatedMinutes, {
                ceHours: course.ceHours,
                displayDuration: course.displayDuration,
              })}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 bg-white/15 text-white hover:bg-white/20">
              <Layers className="h-3.5 w-3.5" aria-hidden />
              {totalModules} modules
            </Badge>
            <Badge variant="secondary" className="gap-1.5 bg-white/15 text-white hover:bg-white/20">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {totalLessons} lessons
            </Badge>
            <Badge variant="secondary" className="gap-1.5 bg-white/15 text-white hover:bg-white/20">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              {formatOnlineCeuHours(course.ceHours)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-teal-700" aria-hidden />
            <h3 className="text-base font-semibold text-slate-900">Skills & knowledge gained</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {objectives.map((objective) => (
              <li key={objective} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden
                />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-700" aria-hidden />
            <h3 className="text-base font-semibold text-slate-900">Your learning path</h3>
          </div>
          <ol className="relative mt-4 space-y-0">
            {course.modules.map((mod, i) => {
              const lessonCount = mod.lessons.length;
              const modMinutes = moduleMinutes[i] ?? 0;
              const isLast = i === course.modules.length - 1;

              return (
                <li key={mod.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast ? (
                    <span
                      className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 bg-teal-200"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-medium text-slate-900">{mod.title}</p>
                    {mod.description ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{mod.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-teal-800">
                      {lessonCount} lesson{lessonCount === 1 ? '' : 's'}
                      {modMinutes > 0 ? ` · ~${modMinutes} min` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
            <li className="relative flex gap-4 pt-2">
              <span
                className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                aria-hidden
              >
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-medium text-slate-900">Certificate of completion</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Pass the final exam and active participation requirements to earn your CE certificate.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div className="border-t border-teal-100/80 bg-white/60 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Module breakdown
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {course.modules.map((mod, i) => (
            <Card key={mod.id} className="border-teal-100/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-teal-800">Module {i + 1}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{mod.title}</p>
                <ul className="mt-2 space-y-1">
                  {mod.lessons.slice(0, 4).map((lesson) => (
                    <li key={lesson.id} className="truncate text-xs text-muted-foreground">
                      {lesson.title}
                    </li>
                  ))}
                  {mod.lessons.length > 4 ? (
                    <li className="text-xs text-teal-700">
                      +{mod.lessons.length - 4} more lesson
                      {mod.lessons.length - 4 === 1 ? '' : 's'}
                    </li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

}
