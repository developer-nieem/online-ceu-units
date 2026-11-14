'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import {
  createCmsCourse,
  createCmsCourseFromBlueprint,
  fetchCmsBlueprints,
  type CmsBlueprintSummary,
} from '@/lib/cms';

type CreateMode = 'blueprint' | 'minimal';

export default function NewCmsCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [mode, setMode] = useState<CreateMode>('blueprint');
  const [blueprints, setBlueprints] = useState<CmsBlueprintSummary[]>([]);
  const [blueprintId, setBlueprintId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchCmsBlueprints().then((res) => {
      if (res.data?.length) {
        setBlueprints(res.data);
        setBlueprintId(res.data[0]!.id);
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = { title, slug: slug.trim() || undefined };
    const res =
      mode === 'blueprint'
        ? await createCmsCourseFromBlueprint({
            ...body,
            blueprintId: blueprintId || undefined,
          })
        : await createCmsCourse(body);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) router.push(`/cms/courses/${res.data.id}`);
  }

  const selected = blueprints.find((b) => b.id === blueprintId);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/cms/courses" className="text-sm text-teal-800 underline">
          ← Courses
        </Link>
        <Link href="/cms/courses/generate" className="text-sm text-violet-800 underline">
          AI-assisted generation →
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Creation mode</legend>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'blueprint'}
                  onChange={() => setMode('blueprint')}
                />
                <span>
                  <span className="font-medium">Standard 1-hour CNA CEU blueprint</span>
                  <span className="block text-muted-foreground">
                    18 lessons, quality checklist, 50-min pacing, final exam shell (20-question
                    bank target).
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'minimal'}
                  onChange={() => setMode('minimal')}
                />
                <span>
                  <span className="font-medium">Minimal shell</span>
                  <span className="block text-muted-foreground">
                    Single module and introduction lesson only.
                  </span>
                </span>
              </label>
            </fieldset>

            {mode === 'blueprint' && blueprints.length > 0 ? (
              <label className="block text-sm">
                <span className="font-medium">Blueprint</span>
                <select
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={blueprintId}
                  onChange={(e) => setBlueprintId(e.target.value)}
                >
                  {blueprints.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label} ({b.lessonCount} lessons)
                    </option>
                  ))}
                </select>
                {selected ? (
                  <p className="mt-1 text-xs text-muted-foreground">{selected.description}</p>
                ) : null}
              </label>
            ) : null}

            <label className="block text-sm">
              <span className="font-medium">Title</span>
              <input
                required
                className="mt-1 w-full rounded border px-2 py-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Slug (optional)</span>
              <input
                className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : mode === 'blueprint' ? 'Create from blueprint' : 'Create draft course'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
