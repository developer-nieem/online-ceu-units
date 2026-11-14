import Link from 'next/link';

import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { getAdminDashboard } from '@/lib/admin-server';

function pct(value: number | null, suffix = '%') {
  if (value === null) return '—';
  return `${value}${suffix}`;
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  const cards = data
    ? [
        { label: 'Total learners', value: data.totalLearners, href: '/admin/learners' },
        {
          label: 'Active enrollments',
          value: data.activeEnrollments,
          href: '/cms',
        },
        {
          label: 'Completed courses',
          value: data.completedCourses,
          href: '/cms',
        },
        {
          label: 'Issued certificates',
          value: data.issuedCertificates,
          href: '/admin/certificates',
        },
        {
          label: 'Online CE hours issued',
          value: data.totalOnlineCeuHoursIssued.toFixed(1),
          hint: 'From approved completions with issued certs',
        },
        {
          label: 'Exam pass rate',
          value: pct(data.examPassRate),
          hint:
            data.examAttemptsGraded > 0
              ? `${data.examAttemptsGraded} graded attempts`
              : 'No final exam attempts yet',
        },
        {
          label: 'Seat-time compliance',
          value: pct(data.seatTimeComplianceRate),
          hint:
            data.seatTimeTrackedEnrollments > 0
              ? `${data.seatTimeTrackedEnrollments} enrollments with ledger`
              : 'No participation ledgers yet',
        },
        {
          label: 'Total revenue',
          value: `$${data.revenue.totalRevenue.toFixed(2)}`,
          hint: `${data.revenue.paidOrderCount} paid orders · placeholder billing`,
          href: '/admin/revenue',
        },
        {
          label: 'Open support tickets',
          value: data.support.openTickets,
          hint: 'Open tickets',
          href: '/admin/support',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Operations overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor learners, course activity, credentials, compliance signals, support tickets, and
          platform audit events. Revenue reporting stays limited until Stripe reporting is connected.
        </p>
      </div>

      {!data ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Could not load dashboard metrics. Sign in as an admin and ensure the API is running.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <AdminStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              hint={card.hint}
              href={card.href}
            />
          ))}
        </div>
      )}

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-medium text-slate-900">Quick links</h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {(
            [
              ['/admin/learners', 'Learner management'],
              ['/admin/students', 'Enrolled students'],
              ['/cms', 'Course operations'],
              ['/admin/generate', 'Generate Course with AI'],
              ['/admin/certificates', 'Certificate monitoring'],
              ['/admin/audit', 'Audit log'],
            ['/admin/analytics', 'Operational analytics'],
            ['/admin/revenue', 'Revenue placeholders'],
            ['/admin/support', 'Support tickets'],
          ] as const
          ).map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="rounded-md bg-slate-100 px-3 py-2 text-slate-800 hover:bg-slate-200"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
