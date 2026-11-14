import Link from 'next/link';

import { AdminCertificateActions } from '@/components/admin/admin-certificate-actions';
import { AdminCertificateDetailButton } from '@/components/admin/admin-certificate-detail-button';
import { getAdminCertificates } from '@/lib/admin-server';

type Props = { searchParams: Promise<{ search?: string }> };

export default async function AdminCertificatesPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const data =
    (await getAdminCertificates({ search })) ?? { certificates: [], complianceWarnings: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Certificates & verification</h1>
        <p className="mt-1 text-sm text-slate-600">
          Issued credentials, public verification URLs, lifecycle controls (revoke / restore /
          archive), and payload inspection.
        </p>
      </div>

      {data.complianceWarnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{data.complianceWarnings.length} compliance warning(s)</p>
          <ul className="mt-2 list-disc pl-5">
            {data.complianceWarnings.slice(0, 10).map((w) => (
              <li key={`${w.certificateId}-${w.type}`}>
                {w.message} (cert {w.certificateId.slice(0, 8)}…)
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Certificate # or learner email"
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
              <th className="px-4 py-3">Certificate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">CE hours</th>
              <th className="px-4 py-3">Verify</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.certificates.map((c) => (
              <tr key={c.id} className="border-b align-top last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium">{c.certificateNo}</span>
                  {c.warnings.length > 0 ? (
                    <span className="mt-1 block text-xs text-amber-700">
                      {c.warnings.join(', ')}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{c.publicVerificationStatus}</span>
                  <p className="text-xs text-slate-500">{c.status}</p>
                </td>
                <td className="px-4 py-3">
                  {c.learnerName || '—'}
                  <p className="text-xs text-slate-500">{c.learnerEmail}</p>
                </td>
                <td className="px-4 py-3">{c.courseTitle}</td>
                <td className="px-4 py-3">{c.onlineCeuHoursLabel}</td>
                <td className="px-4 py-3">
                  <Link
                    href={c.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-800 hover:underline"
                  >
                    Public page
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <AdminCertificateActions
                    certificateId={c.id}
                    publicVerificationStatus={c.publicVerificationStatus}
                  />
                  <AdminCertificateDetailButton certificateId={c.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
