import { Badge } from '@calace/ui/components/ui/badge';
import { Button } from '@calace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@calace/ui/components/ui/card';
import { Clock, Gift, GraduationCap, Lock, PlayCircle, Star } from 'lucide-react';
import Link from 'next/link';

import { EnrollmentStatusBadge } from '@/components/enrollment/enrollment-status-badge';
import type { CatalogCourse } from '@/lib/catalog';
import { formatCourseDurationMinutes, formatOnlineCeuHours } from '@/lib/ceu-display';
import type { LearnerCourseState } from '@/lib/learner-state';
import { formatPrice } from '@/lib/pricing';

function courseActionText(learnerState: LearnerCourseState | undefined, isFree: boolean): string {
  if (learnerState === 'in_progress' || learnerState === 'enrolled') return 'Continue';
  if (learnerState === 'completed') return 'Review';
  return isFree ? 'Start for Free' : 'View';
}

export function CourseCard({
  course,
  learnerState,
  variant,
}: {
  course: CatalogCourse;
  learnerState?: LearnerCourseState;
  variant?: 'default' | 'free';
}) {
  const isFree = variant === 'free' || course.isFree;
  const isUnderFinalization = course.status === 'DRAFT' || course.status === 'REVIEW';
  const actionLabel = courseActionText(learnerState, isFree);

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden transition-shadow ${
        isUnderFinalization ? '' : 'hover:shadow-md'
      } ${
        isFree
          ? 'border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/60 to-white shadow-amber-100/50'
          : ''
      }`}
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {isUnderFinalization ? (
            <Badge
              variant="outline"
              className="gap-1 border-amber-300/70 bg-slate-100 text-slate-700"
            >
              <Lock className="h-3 w-3" aria-hidden />
              Under Finalization
            </Badge>
          ) : null}
          <Badge variant="secondary">{course.categoryName}</Badge>
          {isFree ? (
            <Badge className="gap-1 border-amber-400 bg-amber-500 text-white hover:bg-amber-500">
              <Gift className="h-3 w-3" aria-hidden />
              FREE
            </Badge>
          ) : null}
          {course.featured && !isFree ? (
            <Badge variant="warning" className="gap-1">
              <Star className="h-3 w-3" aria-hidden />
              Featured
            </Badge>
          ) : null}
          {course.hasFreePreview ? (
            <Badge variant="outline" className="gap-1">
              <PlayCircle className="h-3 w-3" aria-hidden />
              Free preview
            </Badge>
          ) : null}
          {!isUnderFinalization && learnerState && learnerState !== 'not_enrolled' ? (
            <EnrollmentStatusBadge state={learnerState} />
          ) : null}
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          {isUnderFinalization ? (
            course.title
          ) : (
            <Link
              href={`/courses/${course.slug}`}
              className={isFree ? 'hover:text-amber-900' : 'hover:text-teal-800'}
            >
              {course.title}
            </Link>
          )}
        </CardTitle>
        <CardDescription className="line-clamp-3">{course.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatCourseDurationMinutes(course.durationMinutes, {
              ceHours: course.ceHours,
              displayDuration: course.displayDuration,
            })}
          </span>
          <span>{formatOnlineCeuHours(course.ceHours)}</span>
          <span className="capitalize">{course.difficulty}</span>
        </div>
        <p className="inline-flex items-center gap-1 text-xs">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden />
          {course.instructor}
        </p>
      </CardContent>
      <CardFooter
        className={`flex items-center justify-between border-t pt-4 ${
          isFree ? 'border-amber-200/80 bg-amber-50/40' : 'bg-muted/20'
        }`}
      >
        <div>
          {isFree ? (
            <>
              <p className="text-lg font-semibold text-amber-800">Free</p>
              <p className="text-xs text-muted-foreground">full certificate included</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-teal-800">{formatPrice(course.price)}</p>
              <p className="text-xs text-muted-foreground">per course</p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isUnderFinalization ? (
            <Button size="sm" disabled title="Not yet available">
              Under Finalization
            </Button>
          ) : (
            <>
              {course.hasFreePreview ? (
                <Button variant="outline" size="sm" disabled title="Coming soon">
                  Preview
                </Button>
              ) : null}
              <Button
                size="sm"
                asChild
                className={isFree ? 'bg-teal-700 hover:bg-teal-800' : undefined}
              >
                <Link href={`/courses/${course.slug}`}>{actionLabel}</Link>
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
