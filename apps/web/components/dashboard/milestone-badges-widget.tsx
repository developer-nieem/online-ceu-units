import { Award } from 'lucide-react';

export function MilestoneBadgesWidget({
  completedCoursesCount,
  milestoneBadgesEarned,
}: {
  completedCoursesCount: number;
  milestoneBadgesEarned: number;
}) {
  const progressToNext = completedCoursesCount % 3;
  const coursesUntilNext = progressToNext === 0 && completedCoursesCount > 0 ? 0 : 3 - progressToNext;

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Award aria-hidden className="size-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Milestone badges</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Earn a success badge for every 3 courses you complete.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-800">{milestoneBadgesEarned}</p>
              <p className="text-xs text-muted-foreground">Badges earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-700">{completedCoursesCount}</p>
              <p className="text-xs text-muted-foreground">Courses completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-700">{progressToNext}/3</p>
              <p className="text-xs text-muted-foreground">Current cycle</p>
            </div>
          </div>

          {milestoneBadgesEarned > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: milestoneBadgesEarned }, (_, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200"
                >
                  <Award aria-hidden className="size-3.5" />
                  {3 * (i + 1)} courses
                </span>
              ))}
            </div>
          ) : null}

          {coursesUntilNext > 0 ? (
            <p className="text-sm text-teal-800">
              {coursesUntilNext} more course{coursesUntilNext === 1 ? '' : 's'} until your next
              badge!
            </p>
          ) : completedCoursesCount > 0 ? (
            <p className="text-sm font-medium text-emerald-700">
              Milestone reached — keep going for your next badge!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete your first course to start earning badges.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
