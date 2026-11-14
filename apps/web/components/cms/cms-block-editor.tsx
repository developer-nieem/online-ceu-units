'use client';

import { useState } from 'react';

import { Button } from '@calace/ui/components/ui/button';

import {
  CONTENT_BLOCK_TYPES,
  createDefaultContentBlock,
  type ContentBlock,
  type ContentBlockType,
  type LessonContentDocument,
} from '@/lib/content-blocks';

const CMS_BLOCK_TYPES = CONTENT_BLOCK_TYPES.filter((t) =>
  [
    'heading',
    'text',
    'image',
    'infographic',
    'video',
    'audio',
    'case_study',
    'reflection',
    'scenario_question',
    'knowledge_check',
    'summary',
    'callout',
  ].includes(t),
) as ContentBlockType[];

type Props = {
  document: LessonContentDocument;
  onChange: (doc: LessonContentDocument) => void;
  disabled?: boolean;
};

export function CmsBlockEditor({ document, onChange, disabled }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    document.blocks[0]?.id ?? null,
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const selected = document.blocks.find((b) => b.id === selectedId) ?? null;

  function updateBlocks(blocks: ContentBlock[]) {
    onChange({ ...document, blocks });
  }

  function addBlock(type: ContentBlockType) {
    const block = createDefaultContentBlock(type);
    updateBlocks([...document.blocks, block]);
    setSelectedId(block.id);
  }

  function removeBlock(id: string) {
    updateBlocks(document.blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = document.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= document.blocks.length) return;
    const blocks = [...document.blocks];
    const [item] = blocks.splice(idx, 1);
    if (!item) return;
    blocks.splice(next, 0, item);
    updateBlocks(blocks);
  }

  function patchBlock(block: ContentBlock) {
    updateBlocks(document.blocks.map((b) => (b.id === block.id ? block : b)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Blocks</p>
        <ul className="space-y-1">
          {document.blocks.map((b, i) => (
            <li key={b.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setSelectedId(b.id)}
                className={`w-full rounded px-2 py-1.5 text-left text-xs ${
                  selectedId === b.id ? 'bg-teal-100 text-teal-900' : 'hover:bg-white'
                }`}
              >
                {i + 1}. {b.type}
              </button>
            </li>
          ))}
        </ul>
        <select
          className="w-full rounded border px-2 py-1 text-xs"
          disabled={disabled}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) addBlock(e.target.value as ContentBlockType);
            e.target.value = '';
          }}
        >
          <option value="">Add block…</option>
          {CMS_BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-4">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-900">{selected.type}</p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => moveBlock(selected.id, -1)}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => moveBlock(selected.id, 1)}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={disabled}
                  onClick={() => removeBlock(selected.id)}
                >
                  Remove
                </Button>
              </div>
            </div>

            {(selected.type === 'heading' || selected.type === 'text') && (
              <div className="space-y-2">
                {selected.type === 'heading' && (
                  <>
                    <span className="text-xs font-medium text-slate-600">Heading text</span>
                    <input
                      className="w-full rounded border px-2 py-1 text-sm"
                      value={selected.text}
                      disabled={disabled}
                      onChange={(e) =>
                        patchBlock({ ...selected, text: e.target.value } as ContentBlock)
                      }
                    />
                  </>
                )}
                {selected.type === 'text' && (
                  <>
                    <span className="text-xs font-medium text-slate-600">Body</span>
                    <textarea
                      className="min-h-[120px] w-full rounded border px-2 py-1 font-mono text-sm"
                      value={selected.body}
                      disabled={disabled}
                      onChange={(e) =>
                        patchBlock({ ...selected, body: e.target.value } as ContentBlock)
                      }
                    />
                  </>
                )}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.requiredForCompletion)}
                    disabled={disabled}
                    onChange={(e) =>
                      patchBlock({
                        ...selected,
                        requiredForCompletion: e.target.checked || undefined,
                      } as ContentBlock)
                    }
                  />
                  Required for lesson completion
                </label>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-slate-500">Block JSON (all types)</span>
              <textarea
                className="mt-1 min-h-[200px] w-full rounded border px-2 py-1 font-mono text-xs"
                disabled={disabled}
                defaultValue={JSON.stringify(selected, null, 2)}
                key={selected.id + selected.type}
                onBlur={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value) as ContentBlock;
                    if (parsed.id !== selected.id) parsed.id = selected.id;
                    patchBlock(parsed);
                    setJsonError(null);
                  } catch {
                    setJsonError('Invalid JSON');
                  }
                }}
              />
              {jsonError ? <p className="text-xs text-red-600">{jsonError}</p> : null}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Select a block to edit.</p>
        )}
      </div>
    </div>
  );
}
