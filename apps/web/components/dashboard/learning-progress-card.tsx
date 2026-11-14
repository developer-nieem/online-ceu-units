import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Progress } from '@calace/ui/components/ui/progress';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

import type { ProgressSummary } from '@/lib/progress';

export function LearningProgressCard({ summary }: { summary: ProgressSummary | null }) {
  const active = summary?.activeCourses ?? [];
  const ceu = summary?.ceuHoursEarned ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-teal-700" aria-hidden />
          Learning progress
        </CardTitle>
        <span className="text-sm font-semibold text-teal-800">{ceu} CEU hrs earned</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary?.ceuHoursEarnedNote ? (
          <p className="text-xs text-muted-foreground">{summary.ceuHoursEarnedNote}</p>
        ) : null}

        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No courses in progress.</p>
        ) : (
          active.slice(0, 3).map((c) => (
            <div key={c.courseSlug} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium line-clamp-1">{c.courseTitle}</span>
                <span className="text-muted-foreground">{c.progressPct}%</span>
              </div>
              <Progress value={c.progressPct} />
              <Button asChild size="sm" className="w-full">
                <Link
                  href={
                    c.resumeLessonSlug
                      ? `/courses/${c.courseSlug}/learn/${c.resumeLessonSlug}`
                      : `/courses/${c.courseSlug}/learn`
                  }
                >
                  Continue learning
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
