'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';

import { AiGeneratedBadge } from '@/components/cms/ai-generated-badge';
import { CmsBlockEditor } from '@/components/cms/cms-block-editor';
import {
  isBlockDocument,
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDocument,
} from '@/lib/content-blocks';
import type { CmsLessonDetail } from '@/lib/cms';
import { updateCmsLessonContent } from '@/lib/cms';

function normalizeContent(raw: unknown, title: string): LessonContentDocument {
  if (isBlockDocument(raw)) return raw;
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title,
    blocks: [],
    generation: { source: 'human' },
  };
}

export function CmsLessonEditor({ lesson }: { lesson: CmsLessonDetail }) {
  const router = useRouter();
  const [doc, setDoc] = useState(() => normalizeContent(lesson.content, lesson.title));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const result = await updateCmsLessonContent(lesson.id, doc);
    setSaving(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage('Lesson content saved.');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            {lesson.course.title} · {lesson.slug}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{lesson.title}</h1>
            {doc.generation?.source === 'ai' ? <AiGeneratedBadge compact /> : null}
          </div>
          {!lesson.editable ? (
            <p className="mt-1 text-sm text-amber-800">
              This lesson belongs to a published version. Create a draft revision on the course to
              edit content.
            </p>
          ) : null}
        </div>
        <Button type="button" disabled={saving || !lesson.editable} onClick={save}>
          {saving ? 'Saving…' : 'Save content'}
        </Button>
      </div>
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}
      <CmsBlockEditor
        document={doc}
        onChange={setDoc}
        disabled={!lesson.editable || saving}
      />
    </div>
  );
}
