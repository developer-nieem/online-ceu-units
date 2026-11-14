import Link from 'next/link';

import { AnalyticsBarChart } from '@/components/admin/analytics/analytics-bar-chart';
import { AnalyticsMetricGrid, pct } from '@/components/admin/analytics/analytics-metric-grid';
import { getAdminAnalytics } from '@/lib/admin-server';

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics();

  if (!data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-medium">Analytics unavailable</p>
        <p className="mt-2">Sign in as admin and ensure the API is running on port 3001.</p>
        <Link href="/admin" className="mt-3 inline-block text-teal-800 underline">
          Back to operations
        </Link>
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Operational analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Institutional intelligence across learners, courses, participation, exams, and
            certificates. Aggregated from live LMS data — not predictive AI.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Generated {new Date(data.generatedAt).toLocaleString()}
          {o.enrollmentScanCapped ? ' · enrollment sample capped' : ''}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Overview</h2>
        <AnalyticsMetricGrid
          metrics={[
            { label: 'Total learners', value: o.totalLearners },
            { label: 'Active learners (7d)', value: o.activeLearners7d },
            { label: 'Active learners (30d)', value: o.activeLearners30d },
            { label: 'Total enrollments', value: o.totalEnrollments },
            { label: 'Active enrollments', value: o.activeEnrollments },
            { label: 'Completions', value: o.completions },
            { label: 'Certificates issued', value: o.issuedCertificates },
            { label: 'CE hours issued', value: o.totalCeHoursIssued.toFixed(1) },
            { label: 'Avg exam pass rate', value: pct(o.averageExamPassRate) },
            {
              label: 'Avg exam score',
              value: o.averageExamScore !== null ? `${o.averageExamScore}%` : '—',
            },
            { label: 'Seat-time completion', value: pct(o.seatTimeCompletionRate) },
            { label: 'Active participation', value: pct(o.activeParticipationRate) },
            { label: 'Course completion rate', value: pct(o.courseCompletionRate) },
            {
              label: 'Learner retention',
              value: '—',
              hint: o.learnerRetentionNote,
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Activity trends (8 weeks)</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <AnalyticsBarChart data={data.trends.enrollments} label="New enrollments" />
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <AnalyticsBarChart
              data={data.trends.completions}
              label="Completions"
              colorClass="bg-emerald-600"
            />
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <AnalyticsBarChart
              data={data.trends.certificates}
              label="Certificates issued"
              colorClass="bg-slate-700"
            />
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <AnalyticsBarChart
              data={data.trends.examPasses}
              label="Final exam passes"
              colorClass="bg-violet-600"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Course intelligence</h2>
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Enrolled</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Drop-off</th>
                <th className="px-4 py-3">Avg progress</th>
                <th className="px-4 py-3">Avg seat time</th>
                <th className="px-4 py-3">Exam score</th>
                <th className="px-4 py-3">Pass / fail</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.items.map((c) => (
                <tr key={c.courseId} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3">{c.enrollments}</td>
                  <td className="px-4 py-3">{c.completions}</td>
                  <td className="px-4 py-3">{pct(c.dropOffRate)}</td>
                  <td className="px-4 py-3">{c.averageProgressPct}%</td>
                  <td className="px-4 py-3">
                    {c.averageSeatTimeMinutes !== null ? `${c.averageSeatTimeMinutes} min` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.averageExamScore !== null ? `${c.averageExamScore}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {pct(c.examPassRate)} / {pct(c.examFailRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium text-slate-900">Most popular courses</h3>
            <ol className="mt-3 space-y-2 text-sm">
              {data.courses.mostPopular.map((c, i) => (
                <li key={c.courseId} className="flex justify-between gap-2">
                  <span>
                    {i + 1}. {c.title}
                  </span>
                  <span className="font-medium text-teal-800">{c.enrollments} enrolled</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium text-slate-900">Most missed exam questions</h3>
            {data.courses.mostMissedQuestions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No graded attempts yet.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {data.courses.mostMissedQuestions.map((q) => (
                  <li key={q.questionId} className="rounded-md border px-3 py-2">
                    <p className="line-clamp-2 text-slate-800">{q.prompt}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {q.missCount} misses · {q.courses.join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Learner intelligence</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">Recently active</h3>
            <ul className="mt-3 divide-y text-sm">
              {data.learners.recentlyActive.map((u) => (
                <li key={u.id} className="flex justify-between py-2">
                  <Link href={`/admin/learners/${u.id}`} className="text-teal-800 hover:underline">
                    {u.name}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium text-amber-900">At risk of non-completion</h3>
            {data.learners.atRisk.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No flagged learners in current sample.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.learners.atRisk.map((l) => (
                  <li key={l.enrollmentId} className="rounded-md border border-amber-100 px-3 py-2">
                    <Link href={`/admin/learners/${l.userId}`} className="font-medium text-teal-800">
                      {l.name}
                    </Link>
                    <p className="text-xs text-slate-600">
                      {l.courseTitle} · {l.progressPct}% · enrolled{' '}
                      {new Date(l.enrolledAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium text-red-900">Repeated exam failures</h3>
            {data.learners.repeatedFailures.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">None in current sample.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.learners.repeatedFailures.map((l) => (
                  <li key={`${l.userId}-${l.courseTitle}`} className="rounded-md border px-3 py-2">
                    <span className="font-medium">{l.name}</span>
                    <p className="text-xs text-slate-600">
                      {l.courseTitle} · {l.failureCount} failures
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Future analytics placeholders</p>
            <p className="mt-2">{data.learners.suspiciousParticipation.note}</p>
            <p className="mt-2">
              {data.learners.incompleteAttestation.note}:{' '}
              <span className="font-semibold text-slate-900">
                {data.learners.incompleteAttestation.count}
              </span>{' '}
              learners flagged
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Participation analytics</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Enrollments with ledger</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.participation.enrollmentsWithLedger}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Avg active minutes</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.participation.averageActiveMinutes ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">{data.participation.activeVsIdleNote}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Avg interactions / enrollment</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.participation.averageInteractionCount ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Seat-time compliance: {pct(data.participation.seatTimeComplianceRate)}
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <AnalyticsBarChart
            data={data.participation.examUnlockTrend}
            label="Exam pass trend (unlock proxy)"
            colorClass="bg-indigo-600"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Certificate analytics</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">Issued by course</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.certificates.byCourse.map((c) => (
                <li key={c.courseTitle} className="flex justify-between">
                  <span>{c.courseTitle}</span>
                  <span>
                    {c.count} certs · {c.ceHours.toFixed(1)} CEU
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">Online CE hour distribution</h3>
            <ul className="mt-3 space-y-2">
              {data.certificates.onlineCeDistribution.map((b) => (
                <li key={b.hours} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0">{b.hours} hr</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{
                        width: `${Math.min(100, (b.count / Math.max(1, data.certificates.issuedTotal)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{b.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">{data.certificates.verificationUsage.note}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">CNA Learners by City</h2>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          {data.topCities.length === 0 ? (
            <p className="text-sm text-slate-500">
              No city data yet — learners can share their city on their profile page.
            </p>
          ) : (
            <ol className="space-y-2 text-sm">
              {data.topCities.map((entry, i) => (
                <li key={entry.city} className="flex justify-between gap-2">
                  <span>
                    #{i + 1} {entry.city}
                  </span>
                  <span className="font-medium text-teal-800">
                    {entry.count} learner{entry.count === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Activity timeline</h2>
        <div className="max-h-96 overflow-y-auto rounded-xl border bg-white shadow-sm">
          <ul className="divide-y text-sm">
            {data.activityTimeline.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase">
                    {e.category}
                  </span>
                  <span className="ml-2 text-slate-800">{e.action}</span>
                  <span className="ml-1 text-slate-500">{e.entityType}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {e.actorEmail} · {new Date(e.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Future: {data.placeholders.aiPredictions} · {data.placeholders.mlAnomalyDetection} ·{' '}
        {data.placeholders.cohortRetention}
      </p>
    </div>
  );
}
