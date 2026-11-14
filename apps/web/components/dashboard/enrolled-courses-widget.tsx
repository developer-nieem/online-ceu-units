import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Progress } from '@calace/ui/components/ui/progress';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

import { EnrollmentStatusBadge } from '@/components/enrollment/enrollment-status-badge';
import type { EnrollmentSummary } from '@/lib/enrollment';

export function EnrolledCoursesWidget({
  enrollments,
}: {
  enrollments: EnrollmentSummary[];
}) {
  const active = enrollments.filter((e) => e.learnerState !== 'completed');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-teal-700" aria-hidden />
          My courses
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/courses">Browse</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active enrollments.{' '}
            <Link href="/courses" className="text-teal-800 underline">
              Find a CEU course
            </Link>
          </p>
        ) : (
          active.map((e) => (
            <div key={e.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={
                    e.canAccessLearn && e.resumeLessonSlug
                      ? `/courses/${e.courseSlug}/learn/${e.resumeLessonSlug}`
                      : e.canAccessLearn
                        ? `/courses/${e.courseSlug}/learn`
                        : `/courses/${e.courseSlug}`
                  }
                  className="font-medium hover:text-teal-800"
                >
                  {e.courseTitle}
                </Link>
                <EnrollmentStatusBadge state={e.learnerState} />
              </div>
              <Progress value={e.progressPct} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{e.ceHours} CEU hrs</span>
                <span>{Math.round(e.progressPct)}%</span>
              </div>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link
                  href={
                    e.resumeLessonSlug
                      ? `/courses/${e.courseSlug}/learn/${e.resumeLessonSlug}`
                      : e.progressPct > 0
                        ? `/courses/${e.courseSlug}/learn`
                        : `/courses/${e.courseSlug}`
                  }
                >
                  {e.progressPct > 0 ? 'Continue learning' : 'Start course'}
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
