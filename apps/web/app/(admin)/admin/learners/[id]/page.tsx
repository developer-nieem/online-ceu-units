import { Button } from '@calace/ui/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminCorrectLegalNameForm } from '@/components/admin/admin-correct-legal-name-form';
import { getAdminLearner } from '@/lib/admin-server';

type Props = { params: Promise<{ id: string }> };

export default async function AdminLearnerDetailPage({ params }: Props) {
  const { id } = await params;
  const learner = await getAdminLearner(id);
  if (!learner) notFound();

  const name =
    [learner.firstName, learner.lastName].filter(Boolean).join(' ') || learner.email;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/learners" className="text-sm text-teal-800 underline">
          ← Learners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{name}</h1>
        <p className="text-sm text-slate-600">{learner.email}</p>
        <p className="mt-1 text-xs text-slate-500">
          Status: {learner.status} · Verified: {learner.emailVerified ? 'yes' : 'no'} · Roles:{' '}
          {learner.roles.join(', ')}
        </p>
        <div className="mt-3">
          <Button asChild>
            <Link href={`/admin/learners/${learner.id}/exams`}>Exam history</Link>
          </Button>
        </div>
      </div>

      <AdminCorrectLegalNameForm learner={learner} />

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Profile</h2>
        {learner.profile ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Jurisdiction</dt>
              <dd>{learner.profile.jurisdiction ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Profession</dt>
              <dd>{learner.profile.profession ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Onboarding</dt>
              <dd>{learner.profile.onboardingComplete ? 'Complete' : 'Incomplete'}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No learner profile on file.</p>
        )}
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Enrollments</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Progress</th>
                <th className="py-2">Completion</th>
              </tr>
            </thead>
            <tbody>
              {learner.enrollments.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="py-2 pr-4">
                    <span className="font-medium">{e.courseTitle}</span>
                    <span className="block text-xs text-slate-500">{e.courseSlug}</span>
                  </td>
                  <td className="py-2 pr-4">{e.status}</td>
                  <td className="py-2 pr-4">{e.progressPct}%</td>
                  <td className="py-2">
                    {e.completion
                      ? `${e.completion.status} · ${e.completion.ceHoursEarned} CEU`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Certificates</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {learner.certificates.length === 0 ? (
            <li className="text-slate-500">None issued.</li>
          ) : (
            learner.certificates.map((c) => (
              <li key={c.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">{c.certificateNo}</span> · {c.status}
                {c.verificationCode ? (
                  <span className="block text-xs text-slate-500">
                    Verify: {c.verificationCode}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Transcript</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {learner.transcript.map((t) => (
            <li key={t.id}>
              {t.title} — {t.ceHours} CEU · {t.completedOn} ({t.entryType})
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Compliance</h2>
        <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(learner.compliance, null, 2)}
        </pre>
      </section>
    </div>
  );
}
