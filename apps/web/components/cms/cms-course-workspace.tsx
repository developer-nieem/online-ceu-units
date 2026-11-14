'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import {
  createCmsLesson,
  createCmsQuestion,
  createCmsRevision,
  duplicateCmsCourse,
  fetchCmsAssessments,
  fetchCmsCourse,
  publishCmsVersion,
  submitCmsCourseReview,
  updateCmsCourse,
  updateCmsModule,
} from '@/lib/cms';
import { AiGeneratedBadge } from '@/components/cms/ai-generated-badge';
import { AiReviewPanel } from '@/components/cms/ai-review-panel';
import { BlueprintPacingPanel } from '@/components/cms/blueprint-pacing-panel';
import { QualityChecklistPanel } from '@/components/cms/quality-checklist-panel';
import type { CmsAiGenerationMeta, CmsAiSafetyItem, CmsMediaPrompts } from '@/lib/ai-generation';
import { AI_APPROVAL_LABELS } from '@/lib/ai-generation';
import type { CmsAssessment, CmsCategory, CmsCourseDetail } from '@/lib/cms';

type Tab = 'general' | 'quality' | 'compliance' | 'structure' | 'assessments' | 'publish';

export function CmsCourseWorkspace({
  course: initial,
  categories,
}: {
  course: CmsCourseDetail;
  categories: CmsCategory[];
}) {
  const router = useRouter();
  const [course, setCourse] = useState(initial);
  const [tab, setTab] = useState<Tab>('general');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<CmsAssessment[] | null>(null);
  const [dupTitle, setDupTitle] = useState('');
  const [renamingModuleId, setRenamingModuleId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const catalog = (course.catalogData ?? {}) as Record<string, unknown>;
  const meta = (course.contentMeta ?? {}) as Record<string, unknown>;
  const compliance = (meta.compliance ?? {}) as Record<string, unknown>;

  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    const res = await updateCmsCourse(course.id, patch);
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    if (res.data) setCourse(res.data);
    setMsg('Saved.');
    router.refresh();
  }

  async function loadAssessments() {
    const res = await fetchCmsAssessments(course.id, course.editableVersionId);
    if (res.data) setAssessments(res.data);
  }

  async function handlePublish() {
    setBusy(true);
    const res = await publishCmsVersion(course.id, course.editableVersionId);
    setBusy(false);
    if (res.error) setMsg(res.error);
    else if (res.data) {
      setCourse(res.data);
      setMsg('Course published to learner catalog.');
      router.refresh();
    }
  }

  const qualityChecklist = (meta.qualityChecklist ?? []) as {
    id: string;
    label: string;
    status: string;
    note: string;
  }[];
  const aiGeneration = meta.aiGeneration as CmsAiGenerationMeta | undefined;
  const aiSafetyReview = (meta.aiSafetyReview ?? []) as CmsAiSafetyItem[];
  const mediaPrompts = meta.mediaPrompts as CmsMediaPrompts | undefined;
  const sourceReferences = aiGeneration?.sourceReferences;
  const aiBlocksPublish =
    aiGeneration && aiGeneration.approvalStatus !== 'instructor_approved';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'quality', label: 'Quality' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'structure', label: 'Lessons' },
    { id: 'assessments', label: 'Exams' },
    { id: 'publish', label: 'Publish' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/cms/courses" className="text-sm text-teal-800 underline">
          ← Courses
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          {aiGeneration ? <AiGeneratedBadge /> : null}
        </div>
        <p className="text-sm text-slate-500">
          {course.slug} · v{course.editableVersionNumber} draft · {course.status}
          {aiGeneration
            ? ` · AI: ${AI_APPROVAL_LABELS[aiGeneration.approvalStatus]}`
            : ''}
        </p>
        <div className="mt-3">
          <Link href={`/cms/courses/${course.id}/preview`}>
            <Button type="button" variant="outline" size="sm">
              Preview draft in learner player
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id === 'assessments') void loadAssessments();
            }}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.id ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg ? <p className="text-sm text-teal-800">{msg}</p> : null}

      {tab === 'general' && (
        <>
        <BlueprintPacingPanel courseId={course.id} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catalog metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title" defaultValue={course.title} onBlur={(v) => save({ title: v })} />
            <Field label="Summary" defaultValue={course.summary ?? ''} multiline onBlur={(v) => save({ summary: v })} />
            <label className="block text-sm">
              <span className="font-medium">Category</span>
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                defaultValue={course.category?.slug ?? ''}
                onChange={(e) => {
                  const cat = categories.find((c) => c.slug === e.target.value);
                  if (cat) void save({ categoryId: cat.id });
                }}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="CE hours"
              type="number"
              defaultValue={String(course.ceHours)}
              onBlur={(v) => save({ ceHours: Number(v) })}
            />
            <Field
              label="Duration (minutes)"
              type="number"
              defaultValue={String(catalog.durationMinutes ?? 60)}
              onBlur={(v) =>
                save({ catalogData: { ...catalog, durationMinutes: Number(v) } })
              }
            />
            <Field
              label="Instructor"
              defaultValue={String(catalog.instructor ?? '')}
              onBlur={(v) => save({ catalogData: { ...catalog, instructor: v } })}
            />
            <Field
              label="Price (USD)"
              type="number"
              defaultValue={String(catalog.price ?? 3.75)}
              onBlur={(v) => save({ catalogData: { ...catalog, price: Number(v) } })}
            />
            <Field
              label="Hero image URL"
              defaultValue={String(meta.heroImage ?? '')}
              onBlur={(v) =>
                save({ contentMeta: { ...meta, heroImage: v.trim() || undefined } })
              }
            />
            <p className="text-xs text-slate-500 mt-1">
              Path to hero banner image, e.g. /assets/courses/falls/hero-banner.jpg —
              leave blank to show the default gradient banner.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={Boolean(catalog.featured)}
                onChange={(e) =>
                  save({ catalogData: { ...catalog, featured: e.target.checked } })
                }
              />
              Featured in catalog
            </label>
            <label className="block text-sm">
              <span className="font-medium">Course status</span>
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                defaultValue={course.status}
                onChange={(e) => save({ status: e.target.value })}
              >
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Duplicate course structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Copy modules, lessons, and exams into a new draft course (same blueprint layout).
            </p>
            <input
              className="w-full rounded border px-2 py-1"
              placeholder="New course title"
              value={dupTitle}
              onChange={(e) => setDupTitle(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy || !dupTitle.trim()}
              onClick={async () => {
                setBusy(true);
                const res = await duplicateCmsCourse(course.id, { title: dupTitle.trim() });
                setBusy(false);
                if (res.error) setMsg(res.error);
                else if (res.data) {
                  router.push(`/cms/courses/${res.data.courseId}`);
                }
              }}
            >
              Duplicate to new course
            </Button>
          </CardContent>
        </Card>
        </>
      )}

      {tab === 'quality' && (
        <div className="space-y-4">
          {aiGeneration ? (
            <AiReviewPanel
              courseId={course.id}
              aiGeneration={aiGeneration}
              safetyReview={aiSafetyReview}
              mediaPrompts={mediaPrompts}
              sourceReferences={sourceReferences}
              onUpdated={() => {
                void fetchCmsCourse(course.id).then((res) => {
                  if (res.data) setCourse(res.data);
                  router.refresh();
                });
              }}
            />
          ) : null}
          <BlueprintPacingPanel courseId={course.id} />
          {qualityChecklist.length > 0 ? (
            <QualityChecklistPanel items={qualityChecklist} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Quality checklist appears on blueprint- or AI-generated courses.
            </p>
          )}
        </div>
      )}

      {tab === 'compliance' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CDPH / regulatory metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Field
              label="CDPH approval status"
              defaultValue={String(compliance.cdphApprovalStatus ?? 'placeholder')}
              onBlur={(v) =>
                save({
                  contentMeta: {
                    ...meta,
                    compliance: { ...compliance, cdphApprovalStatus: v },
                  },
                })
              }
            />
            <Field
              label="NAC / provider reference"
              defaultValue={String(compliance.nacProviderReference ?? '')}
              onBlur={(v) =>
                save({
                  contentMeta: {
                    ...meta,
                    compliance: { ...compliance, nacProviderReference: v },
                  },
                })
              }
            />
            <Field
              label="Target audience"
              defaultValue={String(compliance.targetAudience ?? '')}
              onBlur={(v) =>
                save({
                  contentMeta: {
                    ...meta,
                    compliance: { ...compliance, targetAudience: v },
                  },
                })
              }
            />
            <Field
              label="Required seat time (minutes)"
              type="number"
              defaultValue={String(compliance.requiredSeatTimeMinutes ?? course.ceHours * 50)}
              onBlur={(v) =>
                save({
                  contentMeta: {
                    ...meta,
                    compliance: { ...compliance, requiredSeatTimeMinutes: Number(v) },
                  },
                })
              }
            />
            <Field
              label="Online delivery designation"
              defaultValue={String(compliance.onlineDeliveryDesignation ?? 'online')}
              onBlur={(v) =>
                save({
                  contentMeta: {
                    ...meta,
                    compliance: { ...compliance, onlineDeliveryDesignation: v },
                  },
                })
              }
            />
            <Field
              label="Regulatory notes"
              multiline
              defaultValue={String(compliance.regulatoryNotes ?? '')}
              onBlur={(v) =>
                save({
                  contentMeta: {
                    ...meta,
                    compliance: { ...compliance, regulatoryNotes: v },
                  },
                })
              }
            />
          </CardContent>
        </Card>
      )}

      {tab === 'structure' && (
        <div className="space-y-4">
          {course.structure.map((mod) => (
            <Card key={mod.id}>
              <CardHeader>
                <CardTitle className="text-base">{mod.title}</CardTitle>
                {renamingModuleId === mod.id ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="rounded border px-2 py-1 text-sm"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy || !renameTitle.trim()}
                        onClick={async () => {
                          setBusy(true);
                          await updateCmsModule(mod.id, { title: renameTitle.trim() });
                          setBusy(false);
                          setRenamingModuleId(null);
                          router.refresh();
                        }}
                      >
                        Save
                      </Button>
                      <button
                        type="button"
                        className="text-teal-800 underline text-sm"
                        onClick={() => {
                          setRenamingModuleId(null);
                          setRenameTitle('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Saves to draft. Publish the course to make it visible to learners.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-teal-800 underline text-sm"
                    onClick={() => {
                      setRenamingModuleId(mod.id);
                      setRenameTitle(mod.title);
                    }}
                  >
                    Rename
                  </button>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mod.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between text-sm">
                      <span>
                        {l.title}
                        {l.durationMinutes ? ` · ${l.durationMinutes} min` : ''}
                      </span>
                      <Link
                        href={`/cms/courses/${course.id}/lessons/${l.id}`}
                        className="text-teal-800 underline"
                      >
                        Edit blocks
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await createCmsLesson(mod.id, {
                      title: `New lesson ${mod.lessons.length + 1}`,
                    });
                    setBusy(false);
                    router.refresh();
                  }}
                >
                  Add lesson
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'assessments' && (
        <AssessmentsTab
          courseId={course.id}
          versionId={course.editableVersionId}
          assessments={assessments}
          onReload={loadAssessments}
          busy={busy}
          setBusy={setBusy}
        />
      )}

      {tab === 'publish' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {aiBlocksPublish ? (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
                AI-generated courses cannot be published until an instructor approves the draft on
                the Quality tab.
              </p>
            ) : null}
            <p>
              Publishing sets the draft version (v{course.editableVersionNumber}) live for new
              enrollments. Existing learners keep their enrolled version for certificate integrity.
            </p>
            <ul className="list-disc pl-5 text-slate-600">
              {course.versions.map((v) => (
                <li key={v.id}>
                  v{v.versionNumber} — {v.status}
                  {v.publishedAt ? ` · ${v.publishedAt.slice(0, 10)}` : ''}
                  {v.immutableAfterPublish ? ' · immutable' : ''}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await submitCmsCourseReview(course.id);
                  setBusy(false);
                  router.refresh();
                }}
              >
                Submit for review
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await createCmsRevision(course.id);
                  setBusy(false);
                  router.refresh();
                }}
              >
                New draft revision
              </Button>
              <Button
                type="button"
                disabled={busy || aiBlocksPublish}
                title={
                  aiBlocksPublish
                    ? 'Instructor AI approval required before publish'
                    : undefined
                }
                onClick={handlePublish}
              >
                Publish draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  defaultValue,
  onBlur,
  multiline,
  type = 'text',
}: {
  label: string;
  defaultValue: string;
  onBlur: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  const className = 'mt-1 w-full rounded border px-2 py-1 text-sm';
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {multiline ? (
        <textarea
          className={`${className} min-h-[80px]`}
          defaultValue={defaultValue}
          onBlur={(e) => onBlur(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className={className}
          defaultValue={defaultValue}
          onBlur={(e) => onBlur(e.target.value)}
        />
      )}
    </label>
  );
}

function AssessmentsTab({
  courseId: _courseId,
  versionId: _versionId,
  assessments,
  onReload,
  busy,
  setBusy,
}: {
  courseId: string;
  versionId: string;
  assessments: CmsAssessment[] | null;
  onReload: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const [prompt, setPrompt] = useState('Sample exam question?');
  const exam = assessments?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Final exam question bank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!assessments ? (
          <Button type="button" variant="outline" onClick={onReload}>
            Load assessments
          </Button>
        ) : exam ? (
          <>
            <p>
              {exam.title} · {exam.questionCount} questions · pass {exam.passingScore}% · max{' '}
              {exam.maxAttempts} attempts
            </p>
            <p className="text-xs text-slate-500">
              Pool settings: {JSON.stringify(exam.settings)}
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
              {exam.questions.map((q) => (
                <li key={q.id} className="rounded border bg-slate-50 px-2 py-1">
                  {q.sortOrder + 1}. {q.prompt.slice(0, 80)}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border px-2 py-1"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await createCmsQuestion(exam.id, {
                    type: 'SINGLE_CHOICE',
                    prompt,
                    options: [
                      { id: 'a', label: 'Option A' },
                      { id: 'b', label: 'Option B' },
                    ],
                    correctAnswer: 'b',
                    explanation: 'Placeholder rationale — edit in CMS.',
                  });
                  setBusy(false);
                  onReload();
                }}
              >
                Add question
              </Button>
            </div>
          </>
        ) : (
          <p>No final exam on this version. Create one via API seed pattern or future UI action.</p>
        )}
      </CardContent>
    </Card>
  );
}
