'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import { AiGenerationPreviewPanel } from '@/components/cms/ai-generation-preview';
import {
  fetchAiProviders,
  fetchCmsCategories,
  generateCmsCourseWithAi,
  previewCmsCourseGeneration,
  type AiProviderInfo,
  type CourseGenerationPreview,
  type GenerateCourseAiBody,
} from '@/lib/cms';
import type { CmsCategory } from '@/lib/cms';

const GENERATION_STEPS = [
  'Validating inputs (no PHI)…',
  'Building lesson outline from 1-hour blueprint…',
  'Generating teaching blocks and scenarios…',
  'Drafting exam pool and rationales…',
  'Computing pacing and compliance metadata…',
];

function buildBody(fields: {
  title: string;
  courseCode: string;
  slug: string;
  targetAudience: string;
  ceHours: string;
  categoryLabel: string;
  stateJurisdiction: string;
  profession: string;
  shortDescription: string;
  californiaRelevance: string;
  toneFocus: string;
  categoryId: string;
}): GenerateCourseAiBody {
  return {
    title: fields.title,
    courseCode: fields.courseCode.trim() || undefined,
    slug: fields.slug.trim() || undefined,
    targetAudience: fields.targetAudience.trim() || undefined,
    ceHours: fields.ceHours ? Number(fields.ceHours) : undefined,
    categoryLabel: fields.categoryLabel.trim() || undefined,
    categorySlug: fields.categoryLabel
      ? fields.categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : undefined,
    stateJurisdiction: fields.stateJurisdiction.trim() || undefined,
    profession: fields.profession.trim() || undefined,
    shortDescription: fields.shortDescription.trim() || undefined,
    californiaRelevance: fields.californiaRelevance.trim() || undefined,
    toneFocus: fields.toneFocus.trim() || undefined,
    categoryId: fields.categoryId || undefined,
  };
}

export default function GenerateCmsCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [slug, setSlug] = useState('');
  const [targetAudience, setTargetAudience] = useState(
    'California Certified Nursing Assistants (CNAs)',
  );
  const [ceHours, setCeHours] = useState('1');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [stateJurisdiction, setStateJurisdiction] = useState('California');
  const [profession, setProfession] = useState('CNA');
  const [shortDescription, setShortDescription] = useState('');
  const [californiaRelevance, setCaliforniaRelevance] = useState(
    'Skilled nursing facility practice; Title 22; CDPH Online CE delivery.',
  );
  const [toneFocus, setToneFocus] = useState('person-centered, scope-safe CNA care');
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [providers, setProviders] = useState<AiProviderInfo[]>([]);
  const [preview, setPreview] = useState<CourseGenerationPreview | null>(null);
  const [governanceNotice, setGovernanceNotice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const fields = {
    title,
    courseCode,
    slug,
    targetAudience,
    ceHours,
    categoryLabel,
    stateJurisdiction,
    profession,
    shortDescription,
    californiaRelevance,
    toneFocus,
    categoryId,
  };

  useEffect(() => {
    void fetchAiProviders().then((r) => {
      if (r.data) setProviders(r.data);
    });
    void fetchCmsCategories().then((r) => {
      if (r.data) setCategories(r.data);
    });
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => {
      setStepIndex((i) => (i + 1) % GENERATION_STEPS.length);
    }, 900);
    return () => clearInterval(t);
  }, [busy]);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setPreview(null);
    setStepIndex(0);
    const res = await previewCmsCourseGeneration(buildBody(fields));
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) {
      setPreview(res.data.preview);
      setGovernanceNotice(res.data.governanceNotice);
    }
  }

  async function handleCreateDraft() {
    setBusy(true);
    setError(null);
    const res = await generateCmsCourseWithAi(buildBody(fields));
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.courseId) router.push(`/cms/courses/${res.data.courseId}`);
  }

  const activeProvider = providers.find((p) => p.available);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/cms/courses" className="text-sm text-teal-800 underline">
          ← Courses
        </Link>
        <Link href="/cms/courses/new" className="text-sm text-teal-800 underline">
          Manual / blueprint create
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Generate course blueprint (AI-assisted)</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI produces structured draft content for instructor review. Nothing is published
            automatically. Do not include PHI in any field.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handlePreview(e)} className="space-y-4">
            {activeProvider ? (
              <p className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
                Provider: <strong>{activeProvider.label}</strong>
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Course title *</span>
                <input
                  required
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Course code</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CEU-IC-101"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Slug</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Short description</span>
                <textarea
                  className="mt-1 w-full rounded border px-2 py-1"
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Target audience</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">CE hours</span>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={ceHours}
                  onChange={(e) => setCeHours(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Profession</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">State / jurisdiction</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={stateJurisdiction}
                  onChange={(e) => setStateJurisdiction(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Topic / category</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                />
              </label>
              {categories.length > 0 ? (
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium">Catalog category</span>
                  <select
                    className="mt-1 w-full rounded border px-2 py-1"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">California / regulatory focus</span>
                <textarea
                  className="mt-1 w-full rounded border px-2 py-1"
                  rows={2}
                  value={californiaRelevance}
                  onChange={(e) => setCaliforniaRelevance(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Tone / clinical focus</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={toneFocus}
                  onChange={(e) => setToneFocus(e.target.value)}
                />
              </label>
            </div>

            {busy ? (
              <div
                className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
                role="status"
                aria-live="polite"
              >
                <p className="font-medium">Working…</p>
                <p className="mt-1">{GENERATION_STEPS[stepIndex]}</p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || !title.trim()}>
                {busy && !preview ? 'Generating preview…' : 'Preview blueprint'}
              </Button>
              {preview ? (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCreateDraft()}
                >
                  {busy ? 'Creating draft…' : 'Create draft course'}
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {preview ? (
        <>
          <AiGenerationPreviewPanel preview={preview} />
          {governanceNotice ? (
            <p className="text-xs text-muted-foreground">{governanceNotice}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
