import Link from 'next/link';

import type { AuditCategory } from '@/lib/admin';
import { getAdminAudit } from '@/lib/admin-server';

const CATEGORIES: { id: AuditCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'login', label: 'Login' },
  { id: 'enrollment', label: 'Enrollment' },
  { id: 'participation', label: 'Participation' },
  { id: 'exam', label: 'Exam' },
  { id: 'attestation', label: 'Attestation' },
  { id: 'certificate', label: 'Certificate' },
];

type Props = { searchParams: Promise<{ category?: string }> };

export default async function AdminAuditPage({ searchParams }: Props) {
  const { category: raw } = await searchParams;
  const category = (CATEGORIES.some((c) => c.id === raw) ? raw : 'all') as AuditCategory;
  const entries = (await getAdminAudit({ category, limit: 150 })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">
          Platform activity: authentication, enrollments, participation, exams, attestations, and
          certificate issuance.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={c.id === 'all' ? '/admin/audit' : `/admin/audit?category=${c.id}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              category === c.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200'
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Actor</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3">{e.action}</td>
                <td className="px-4 py-3">
                  {e.entityType}
                  <span className="block font-mono text-xs text-slate-500">
                    {e.entityId.slice(0, 12)}…
                  </span>
                </td>
                <td className="px-4 py-3">{e.actorEmail ?? 'system'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
