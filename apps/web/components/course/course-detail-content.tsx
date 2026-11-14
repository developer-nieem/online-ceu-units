import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Clock, GraduationCap, PlayCircle, Shield } from 'lucide-react';
import Link from 'next/link';

import { EnrollPanel } from './enroll-panel';
import { TrackCourseView } from './track-course-view';
import { WhatYoullLearnSection } from './what-youll-learn-section';
import type { CourseDetail } from '@/lib/course-detail';
import { formatCourseDurationMinutes, formatOnlineCeuHours } from '@/lib/ceu-display';
import { mediaUrl } from '@/lib/media-url';
import type { CourseEnrollmentStatus } from '@/lib/enrollment';

const ACCENT_GRADIENT: Record<string, string> = {
  teal: 'from-teal-600 to-teal-800',
  violet: 'from-violet-600 to-violet-800',
  blue: 'from-blue-600 to-blue-800',
  amber: 'from-amber-600 to-amber-800',
  emerald: 'from-emerald-600 to-emerald-800',
  rose: 'from-rose-600 to-rose-800',
};

/** Hero fade overlay — `from-*` only; pairing with `to-*` breaks `to-transparent` for some accents. */
const ACCENT_FADE: Record<string, string> = {
  teal: 'from-teal-600',
  violet: 'from-violet-600',
  blue: 'from-blue-600',
  amber: 'from-amber-600',
  emerald: 'from-emerald-600',
  rose: 'from-rose-600',
};

export function CourseDetailContent({
  course,
  enrollmentStatus,
}: {
  course: CourseDetail;
  enrollmentStatus: CourseEnrollmentStatus;
}) {
  const gradient = ACCENT_GRADIENT[course.imageAccent] ?? ACCENT_GRADIENT.teal;
  const fade = ACCENT_FADE[course.imageAccent] ?? ACCENT_FADE.teal;

  return (
    <div className="space-y-8">
      <TrackCourseView courseSlug={course.slug} />

      <Link href="/courses" className="text-sm text-teal-800 underline">
        ← Back to catalog
      </Link>

      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-6 py-10 text-white`}
      >
        {course.heroImage ? (
          <>
            <img
              src={mediaUrl(course.heroImage)}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover object-[75%_center] lg:inset-y-0 lg:left-auto lg:right-0 lg:w-3/5 lg:object-right"
            />
            <div
              aria-hidden
              className={`absolute inset-0 hidden bg-gradient-to-r ${fade} from-20% to-transparent lg:block`}
            />
          </>
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 lg:from-black/45 lg:via-black/20 lg:to-transparent"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0wIDQwTDQwIDAgWiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {course.categoryName}
            </Badge>
            {course.featured ? (
              <Badge variant="warning">Featured</Badge>
            ) : null}
            {course.hasFreePreview ? (
              <Badge variant="outline" className="gap-1 border-white/40 text-white">
                <PlayCircle className="h-3 w-3" aria-hidden />
                Free preview
              </Badge>
            ) : null}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="max-w-2xl text-white/90">{course.summary}</p>
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden />
              {formatCourseDurationMinutes(course.durationMinutes, {
                ceHours: course.ceHours,
                displayDuration: course.displayDuration,
              })}
            </span>
            <span>{formatOnlineCeuHours(course.ceHours)}</span>
            <span className="capitalize">{course.difficulty}</span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-4 w-4" aria-hidden />
              {course.instructor}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Overview</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">{course.overview}</p>
          </section>

          <WhatYoullLearnSection course={course} />

          <section>
            <h2 className="text-lg font-semibold">Course outline</h2>
            <div className="mt-4 space-y-4">
              {course.modules.map((mod, i) => (
                <Card key={mod.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Module {i + 1}: {mod.title}
                    </CardTitle>
                    {mod.description ? (
                      <p className="text-sm text-muted-foreground">{mod.description}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ol className="space-y-2">
                      {mod.lessons.map((lesson, j) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span>
                            {j + 1}. {lesson.title}
                          </span>
                          {lesson.durationMinutes ? (
                            <span className="text-muted-foreground">
                              {lesson.durationMinutes} min
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {course.faq.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold">FAQ</h2>
              <dl className="mt-4 space-y-4">
                {course.faq.map((item) => (
                  <div key={item.question} className="rounded-lg border p-4">
                    <dt className="font-medium">{item.question}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-teal-700" aria-hidden />
              Provider & completion requirements
            </h2>
            <Card className="mt-4">
              <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
                <div>
                  <p>
                    <span className="font-medium text-foreground">Provider:</span>{' '}
                    {course.compliance.providerName}
                  </p>
                  {course.compliance.providerContact ? (
                    <p className="mt-1">{course.compliance.providerContact}</p>
                  ) : null}
                  {course.compliance.approvalStatusLabel ? (
                    <p className="mt-1 text-teal-800">{course.compliance.approvalStatusLabel}</p>
                  ) : null}
                </div>
                <div>
                  <p className="font-medium text-foreground">To earn your certificate</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {course.compliance.completionRequirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                {course.compliance.supportContact ? (
                  <p>
                    Support:{' '}
                    <Link href="/support" className="text-teal-800 underline">
                      {course.compliance.supportContact}
                    </Link>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </div>

        <EnrollPanel course={course} enrollmentStatus={enrollmentStatus} />
      </div>
    </div>
  );
}
