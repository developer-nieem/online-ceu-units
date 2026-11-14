import Link from 'next/link';

import { getAdminLearners } from '@/lib/admin-server';

type Props = { searchParams: Promise<{ search?: string }> };

export default async function AdminLearnersPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const learners = (await getAdminLearners({ search, limit: 100 })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Learners</h1>
        <p className="mt-1 text-sm text-slate-600">Search and open learner profiles for ops review.</p>
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

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Enrollments</th>
              <th className="px-4 py-3">Certs</th>
              <th className="px-4 py-3">Last login</th>
            </tr>
          </thead>
          <tbody>
            {learners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No learners found.
                </td>
              </tr>
            ) : (
              learners.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/learners/${u.id}`} className="font-medium text-teal-800">
                        {name}
                      </Link>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">{u.status}</td>
                    <td className="px-4 py-3">{u.enrollmentCount}</td>
                    <td className="px-4 py-3">{u.certificateCount}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
