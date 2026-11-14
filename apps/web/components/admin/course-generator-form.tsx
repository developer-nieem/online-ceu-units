'use client';

import { AI_GOVERNANCE_NOTICE } from '@calace/ai-course-generation/governance';
import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { generateCourseViaFactory, type GenerateCourseFactoryBody } from '@/lib/course-factory';

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

export function CourseGeneratorForm() {
  const router = useRouter();
  const [courseTitle, setCourseTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('California CNAs and HHAs');
  const [ceHours, setCeHours] = useState('1');
  const [regulatoryContext, setRegulatoryContext] = useState('');
  const [providerId, setProviderId] = useState<'anthropic' | 'mock'>('anthropic');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const body: GenerateCourseFactoryBody = {
      courseTitle: courseTitle.trim(),
      topicDescription: topicDescription.trim(),
      targetAudience: targetAudience.trim() || undefined,
      ceHours: ceHours ? Number(ceHours) : undefined,
      regulatoryContext: regulatoryContext.trim() || undefined,
      providerId,
    };

    const res = await generateCourseViaFactory(body);
    setBusy(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.data?.courseSlug) {
      router.push(`/cms/courses/${res.data.courseSlug}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div
        className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        role="note"
      >
        {AI_GOVERNANCE_NOTICE}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Course Draft</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI creates a structured DRAFT course with lessons, content blocks, and an exam. Nothing
            is published automatically — review in CMS before going live.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium">Course Title *</span>
              <input
                required
                minLength={3}
                className={`mt-1 ${inputClass}`}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Pressure Injury Prevention for CNAs"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Topic Description *</span>
              <textarea
                required
                minLength={10}
                rows={4}
                className={`mt-1 ${inputClass}`}
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                placeholder="Describe what this course covers, the key concepts, and what learners will be able to do after completing it."
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Target Audience</span>
              <input
                className={`mt-1 ${inputClass}`}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="California CNAs and HHAs"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">CE Hours</span>
              <input
                type="number"
                min={1}
                max={3}
                step={1}
                className={`mt-1 ${inputClass}`}
                value={ceHours}
                onChange={(e) => setCeHours(e.target.value)}
                placeholder="1"
              />
              <p className="mt-1 text-xs text-slate-500">
                Standard Cal Ace courses are 1 CE hour.
              </p>
            </label>

            <label className="block text-sm">
              <span className="font-medium">Regulatory Context</span>
              <textarea
                rows={2}
                className={`mt-1 ${inputClass}`}
                value={regulatoryContext}
                onChange={(e) => setRegulatoryContext(e.target.value)}
                placeholder="e.g. Title 22 CCR, CDPH 283A/283C, OSHA standards"
              />
              <p className="mt-1 text-xs text-slate-500">
                Optional: include relevant California regulations or CDPH requirements.
              </p>
            </label>

            <label className="block text-sm">
              <span className="font-medium">AI Provider</span>
              <select
                className={`mt-1 ${inputClass}`}
                value={providerId}
                onChange={(e) => setProviderId(e.target.value as 'anthropic' | 'mock')}
              >
                <option value="anthropic">Anthropic Claude (recommended)</option>
                <option value="mock">Mock Generator (development)</option>
              </select>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button type="submit" disabled={busy || courseTitle.trim().length < 3}>
              {busy ? 'Generating... this may take 30-60 seconds' : 'Generate Course Draft'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
