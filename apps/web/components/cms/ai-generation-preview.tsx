'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import type { CourseGenerationPreview } from '@/lib/cms';

export function AiGenerationPreviewPanel({ preview }: { preview: CourseGenerationPreview }) {
  return (
    <Card className="border-violet-200">
      <CardHeader>
        <CardTitle className="text-base text-violet-950">Generated draft preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review the outline before saving. Clinical content remains editable in CMS after creation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium">{preview.title}</p>
          {preview.courseCode ? (
            <p className="text-muted-foreground">Code: {preview.courseCode}</p>
          ) : null}
          <p className="mt-2 text-muted-foreground">{preview.summary}</p>
        </div>

        <div>
          <p className="font-medium">Learning objectives</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {preview.learningObjectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-medium">Key terms</p>
          <p className="text-muted-foreground">{preview.keyTerms.join(' · ')}</p>
        </div>

        <div>
          <p className="font-medium">Lesson outline ({preview.lessonOutline.length} modules)</p>
          {preview.lessonOutline.map((mod) => (
            <div key={mod.moduleSlug} className="mt-2 rounded border bg-slate-50 p-2">
              <p className="font-medium text-slate-800">{mod.moduleTitle}</p>
              <ul className="mt-1 text-xs text-muted-foreground">
                {mod.lessons.map((l) => (
                  <li key={l.slug}>
                    {l.title} (~{l.estimatedActiveMinutes} min)
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <p className="font-medium">Final exam (draft)</p>
          <p className="text-muted-foreground">
            {preview.exam.draftQuestionCount} draft questions · bank target{' '}
            {preview.exam.targetBankSize} · types:{' '}
            {Object.entries(preview.exam.questionTypes)
              .map(([t, n]) => `${t} (${n})`)
              .join(', ')}
          </p>
        </div>

        {preview.courseThumbnailPrompt ? (
          <div>
            <p className="font-medium">Course thumbnail (image pipeline)</p>
            <p className="text-xs text-muted-foreground">{preview.courseThumbnailPrompt}</p>
          </div>
        ) : null}

        <div>
          <p className="font-medium">Pacing</p>
          <p
            className={
              preview.pacing.meetsMinimum ? 'text-emerald-800' : 'text-amber-900'
            }
          >
            {preview.pacing.estimatedActiveMinutes} active min (target{' '}
            {preview.pacing.targetActiveMinutes})
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Provider: {preview.providerId} · {preview.promptVersion}
        </p>
      </CardContent>
    </Card>
  );
}
