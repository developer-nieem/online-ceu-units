'use client';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { useEffect, useRef, useState } from 'react';

import {
  saveExamAttemptAnswers,
  submitExamAttempt,
  type PresentedQuestion,
  type SubmitAttemptResponse,
} from '@/lib/assessments';

export function ExamRunner({
  attemptId,
  passingScore,
  questions,
  initialAnswers,
  onSubmitted,
}: {
  attemptId: string;
  passingScore: number;
  questions: PresentedQuestion[];
  initialAnswers?: Record<string, string | string[]>;
  onSubmitted: (result: SubmitAttemptResponse) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    initialAnswers ?? {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialAnswersRef = useRef(initialAnswers ?? {});
  const skipUntilUserChangeRef = useRef(true);

  useEffect(() => {
    if (skipUntilUserChangeRef.current) {
      const initial = initialAnswersRef.current;
      const unchanged =
        JSON.stringify(answers) === JSON.stringify(initial);
      if (unchanged) return;
      skipUntilUserChangeRef.current = false;
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          await saveExamAttemptAnswers(attemptId, answers);
        } catch {
          // fire-and-forget: autosave must never interrupt the learner
        }
      })();
    }, 1500);

    return () => clearTimeout(timer);
  }, [answers, attemptId]);

  function setSingle(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function toggleMulti(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const list = Array.isArray(current) ? [...current] : current ? [current] : [];
      if (list.includes(optionId)) {
        return { ...prev, [questionId]: list.filter((id) => id !== optionId) };
      }
      return { ...prev, [questionId]: [...list, optionId] };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await submitExamAttempt(attemptId, answers);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) onSubmitted(result.data);
  }

  const unanswered = questions.filter((q) => {
    if (!q?.id) return false;
    const a = answers?.[q.id];
    if (q.type === 'MULTIPLE_CHOICE') return !Array.isArray(a) || a.length === 0;
    return !a;
  }).length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Passing score: {passingScore}% · {questions.length} questions · Answers are graded on
        the server after submit.
      </p>

      {questions.map((q, index) => {
        if (!q) return null;

        return (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Question {index + 1} of {questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.scenarioContext ? (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {q.scenarioContext}
                </p>
              ) : null}
              <p className="font-medium">{q.prompt}</p>

              {q.type === 'MULTIPLE_CHOICE' ? (
                <div className="space-y-2" role="group" aria-label={q.prompt}>
                  {q.options
                    ?.filter((opt) => opt && opt.id)
                    .map((opt) => {
                      const selected = answers?.[q.id];
                      const checked =
                        Array.isArray(selected) && selected.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex cursor-pointer gap-2 rounded-md border p-3 text-sm ${
                            checked ? 'border-teal-600 bg-teal-50/40' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMulti(q.id, opt.id)}
                            className="mt-0.5"
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                </div>
              ) : (
                <div className="space-y-2" role="radiogroup" aria-label={q.prompt}>
                  {q.options
                    ?.filter((opt) => opt && opt.id)
                    .map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer gap-2 rounded-md border p-3 text-sm ${
                          answers?.[q?.id] === opt?.id
                            ? 'border-teal-600 bg-teal-50/40'
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers?.[q?.id] === opt?.id}
                          onChange={() => setSingle(q.id, opt.id)}
                          className="mt-0.5"
                        />
                        {opt.label}
                      </label>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button
        type="button"
        size="lg"
        disabled={submitting || unanswered > 0}
        onClick={() => void handleSubmit()}
      >
        {submitting
          ? 'Submitting…'
          : unanswered > 0
            ? `Answer ${unanswered} remaining question(s)`
            : 'Submit final exam'}
      </Button>
    </div>
  );
}
