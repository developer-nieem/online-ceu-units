import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAdminExamAttempts, getAdminLearner } from '@/lib/admin-server';

type Props = { params: Promise<{ id: string }> };

function formatWhen(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  if (status === 'VOIDED') return 'bg-amber-100 font-semibold text-amber-950';
  if (status === 'PASSED') return 'bg-teal-50 text-teal-900';
  if (status === 'FAILED') return 'bg-red-50 text-red-900';
  return 'bg-slate-100 text-slate-800';
}

export default async function AdminLearnerExamsPage({ params }: Props) {
  const { id } = await params;
  const learner = await getAdminLearner(id);
  if (!learner) notFound();

  const attempts = await getAdminExamAttempts(id);
  const name =
    [learner.firstName, learner.lastName].filter(Boolean).join(' ') || learner.email;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/learners/${learner.id}`} className="text-sm text-teal-800 underline">
          ← {name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Exam history</h1>
        <p className="text-sm text-slate-600">{learner.email}</p>
      </div>

      <section className="rounded-xl border bg-white p-5">
        {attempts == null ? (
          <p className="text-sm text-slate-600">Exam history is unavailable.</p>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-slate-600">No exam attempts on file.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Exam</th>
                  <th className="py-2 pr-4">Attempt</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-t">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{attempt.course.title}</span>
                      <span className="block text-xs text-slate-500">{attempt.course.slug}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <span>{attempt.exam.title}</span>
                      <span className="block text-xs text-slate-500">{attempt.exam.slug}</span>
                    </td>
                    <td className="py-2 pr-4">{attempt.attemptNum}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs ${statusClass(attempt.status)}`}>
                        {attempt.status === 'VOIDED' ? 'VOIDED' : attempt.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {attempt.score == null ? '—' : `${attempt.score}%`}
                    </td>
                    <td className="py-2 pr-4">{formatWhen(attempt.startedAt)}</td>
                    <td className="py-2 pr-4">{formatWhen(attempt.submittedAt)}</td>
                    <td className="py-2">
                      <Link
                        href={`/admin/learners/${learner.id}/exams/${attempt.id}`}
                        className="text-teal-800 underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
