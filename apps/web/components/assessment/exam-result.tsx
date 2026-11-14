import { Button } from '@calace/ui/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import Link from 'next/link';



import { CourseRestartButton } from './course-restart-button';

import type { SubmitAttemptResponse } from '@/lib/assessments';



export function ExamResult({

  result,

  courseSlug,

  onRetry,

  locked,

}: {

  result: SubmitAttemptResponse;

  courseSlug: string;

  onRetry?: () => void;

  locked?: boolean;

}) {

  const needsReset = Boolean(result.requiresReset ?? result.requiresRepurchase);



  return (

    <div className="space-y-6">

      <Card className={result.passed ? 'border-teal-300' : 'border-amber-300'}>

        <CardHeader>

          <CardTitle>

            {result.passed ? 'You passed!' : 'Not passed yet'}

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-2 text-sm">

          <p>

            Score: <span className="font-semibold">{result.score}%</span> (required{' '}

            {result.passingScore}%)

          </p>

          {result.remediationMessage ? (

            <p className="text-muted-foreground">{result.remediationMessage}</p>

          ) : null}

          {result.passed && result.nextSteps ? (

            <div className="rounded-md bg-teal-50 px-3 py-2 text-teal-950">

              <p className="font-medium">{result.nextSteps.message}</p>

              {result.nextSteps.certificatePlaceholder ? (

                <p className="mt-1 text-sm">{result.nextSteps.certificatePlaceholder}</p>

              ) : null}

              <Button asChild className="mt-3" size="sm">

                <Link href={result.nextSteps.href}>Continue to course</Link>

              </Button>

              <Button asChild variant="outline" className="ml-2 mt-3" size="sm">

                <Link href="/certificates">View certificates</Link>

              </Button>

            </div>

          ) : null}

        </CardContent>

      </Card>



      <section className="space-y-3">

        <h2 className="text-lg font-semibold">Answer review</h2>

        {result.results.map((r, i) => (

          <Card key={r.questionId}>

            <CardHeader className="pb-2">

              <CardTitle className="text-sm">

                Question {i + 1} — {r.correct ? 'Correct' : 'Incorrect'}

              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-1 text-sm">

              {r.explanation ? <p>{r.explanation}</p> : null}

              {r.remediation && !r.correct ? (

                <p className="text-amber-800">{r.remediation}</p>

              ) : null}

              {!r.correct && r.correctAnswerSummary ? (

                <p className="text-muted-foreground">

                  Correct answer: {r.correctAnswerSummary}

                </p>

              ) : null}

            </CardContent>

          </Card>

        ))}

      </section>



      {!result.passed ? (

        <div className="flex flex-wrap gap-2">

          {needsReset ? (

            <>

              <CourseRestartButton courseSlug={courseSlug} />

              <Button asChild variant="outline">

                <Link href="/courses">Choose another course</Link>

              </Button>

            </>

          ) : locked ? (

            <p className="text-sm text-red-700">

              Maximum attempts reached. Restart the course to try again.

            </p>

          ) : onRetry ? (

            <Button type="button" onClick={onRetry}>

              Try again

            </Button>

          ) : null}

          <Button variant="outline" asChild>

            <Link href={`/courses/${courseSlug}/learn`}>Return to lessons</Link>

          </Button>

        </div>

      ) : null}

    </div>

  );

}


