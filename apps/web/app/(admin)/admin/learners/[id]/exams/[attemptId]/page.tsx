import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAdminExamAttempt, getAdminLearner } from '@/lib/admin-server';

type Props = { params: Promise<{ id: string; attemptId: string }> };

const BANK_WORDING_NOTICE =
  'Question and option text shown is the current bank version and may differ from what was presented at attempt time. The as-graded correct answer and explanation are preserved from grade time.';

function formatWhen(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function passFailLabel(status: string) {
  if (status === 'PASSED') return 'Pass';
  if (status === 'FAILED') return 'Fail';
  if (status === 'VOIDED') return 'VOIDED — not a pass/fail result';
  return '—';
}

export default async function AdminLearnerExamAttemptPage({ params }: Props) {
  const { id, attemptId } = await params;
  const learner = await getAdminLearner(id);
  if (!learner) notFound();

  const attempt = await getAdminExamAttempt(id, attemptId);
  if (!attempt) notFound();

  const name =
    [learner.firstName, learner.lastName].filter(Boolean).join(' ') || learner.email;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/learners/${learner.id}/exams`} className="text-sm text-teal-800 underline">
          ← Exam history · {name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{attempt.exam.title}</h1>
        <p className="text-sm text-slate-600">
          {attempt.course.title} · {attempt.exam.slug}
        </p>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-medium">Attempt</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Attempt number</dt>
            <dd>{attempt.attemptNum}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span
                className={
                  attempt.status === 'VOIDED'
                    ? 'inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950'
                    : undefined
                }
              >
                {attempt.status === 'VOIDED' ? 'VOIDED' : attempt.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Score</dt>
            <dd>{attempt.score == null ? '—' : `${attempt.score}%`}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Pass / fail</dt>
            <dd>{passFailLabel(attempt.status)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Started</dt>
            <dd>{formatWhen(attempt.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Submitted</dt>
            <dd>{formatWhen(attempt.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Graded</dt>
            <dd>{formatWhen(attempt.gradedAt)}</dd>
          </div>
        </dl>
      </section>

      <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="note">
        {BANK_WORDING_NOTICE}
      </p>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900">Questions presented</h2>
        {attempt.questions.length === 0 ? (
          <p className="text-sm text-slate-600">No presented questions are stored on this attempt.</p>
        ) : (
          <ol className="space-y-4">
            {attempt.questions.map((question, index) => (
              <li key={question.questionId} className="rounded-xl border bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Question {index + 1}
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {question.prompt ?? 'Question text is not in the current bank.'}
                </p>
                {question.options.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {question.options.map((option) => {
                      const selected = Array.isArray(question.learnerAnswer)
                        ? question.learnerAnswer.includes(option.id)
                        : question.learnerAnswer === option.id;
                      return (
                        <li key={option.id}>
                          {option.label ?? option.id}
                          {selected ? ' · student answer' : ''}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Student answer</dt>
                    <dd>
                      {question.learnerAnswerLabels.length > 0
                        ? question.learnerAnswerLabels.join('; ')
                        : 'No answer recorded'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Result</dt>
                    <dd>
                      {question.correct == null ? '—' : question.correct ? 'Correct' : 'Incorrect'}
                      {question.pointsEarned != null && question.pointsPossible != null
                        ? ` · ${question.pointsEarned}/${question.pointsPossible}`
                        : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">As-graded correct answer</dt>
                    <dd>{question.correctAnswerSummary ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">As-graded explanation</dt>
                    <dd>{question.explanation ?? '—'}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
