import Link from 'next/link';

import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { getAdminEnrolledStudents } from '@/lib/admin-server';

type Props = { searchParams: Promise<{ search?: string; page?: string }> };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function listHref(search: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/admin/students${qs ? `?${qs}` : ''}`;
}

export default async function AdminEnrolledStudentsPage({ searchParams }: Props) {
  const { search, page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const data = await getAdminEnrolledStudents({ search, page });
  const students = data?.students ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Enrolled students</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Every student with an enrollment record, including 1-Year Unlimited, 2-Year Unlimited,
          single-course, free, and any other plan. Development and internal test accounts are
          omitted from this list and from both totals. Their accounts and enrollment records are
          unchanged.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Email or name"
          className="min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      {!data ? (
        <p className="text-sm text-slate-500">Unable to load enrolled students.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminStatCard
              label="Enrolled students"
              value={data.totalEnrolledStudents}
              hint="Each person is counted once, even with more than one course."
            />
            <AdminStatCard
              label="Enrollments"
              value={data.totalEnrollments}
              hint="Each enrollment record is counted, for every plan and status."
            />
          </div>

          {search ? (
            <p className="text-sm text-slate-600">
              This search matches {data.matchingStudents ?? 0} enrolled{' '}
              {(data.matchingStudents ?? 0) === 1 ? 'student' : 'students'} and{' '}
              {data.matchingEnrollments ?? 0}{' '}
              {(data.matchingEnrollments ?? 0) === 1 ? 'enrollment' : 'enrollments'}. The totals
              above include every enrollment record.
            </p>
          ) : null}

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-medium text-slate-900">Student names</h2>
              <p className="text-sm text-slate-600">
                {data.totalEnrollments} {data.totalEnrollments === 1 ? 'enrollment' : 'enrollments'}{' '}
                across {data.totalEnrolledStudents}{' '}
                {data.totalEnrolledStudents === 1 ? 'student' : 'students'}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Enrollments</th>
                    <th className="px-4 py-3">Plans</th>
                    <th className="px-4 py-3">Latest enrollment</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        {search ? 'No enrolled students match this search.' : 'No enrolled students.'}
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.userId} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <Link
                            href={`/admin/learners/${student.userId}`}
                            className="text-teal-800 hover:underline"
                          >
                            {student.fullName || '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{student.email}</td>
                        <td className="px-4 py-3">{student.enrollmentCount}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {student.plans.length > 0 ? student.plans.join(', ') : 'Not recorded'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(student.latestEnrolledAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {data.pageCount > 1 ? (
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-600">
                  Page {data.page} of {data.pageCount}
                </p>
                <div className="flex gap-2">
                  {data.page > 1 ? (
                    <Link
                      href={listHref(search, data.page - 1)}
                      className="rounded-md border bg-white px-3 py-1.5 text-slate-800 hover:bg-slate-50"
                    >
                      Previous
                    </Link>
                  ) : null}
                  {data.page < data.pageCount ? (
                    <Link
                      href={listHref(search, data.page + 1)}
                      className="rounded-md border bg-white px-3 py-1.5 text-slate-800 hover:bg-slate-50"
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
