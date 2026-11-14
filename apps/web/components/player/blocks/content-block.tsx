'use client';

import { Button } from '@calace/ui/components/ui/button';
import type {
  ContentBlock,
  LessonBlockProgress,
} from '@calace/content-blocks';
import {
  AlertTriangle,
  BookOpen,
  Headphones,
  ImageIcon,
  LayoutGrid,
  Lightbulb,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { mediaUrl } from '@/lib/media-url';

import { ArrangeGame } from '../arrange-game';
import { KnowledgeCheck } from '../knowledge-check';
import { TriviaCard } from '../trivia-card';
import { TrueFalseChallenge } from '../true-false-challenge';
import { VideoBlock } from '../video-block';
import { BlockShell } from './block-shell';

type BlockInteractionResult = { ok: true } | { ok: false; error: string };

type BlockInteractionHandler = (params: {
  blockId: string;
  eventType: 'interaction_completed' | 'knowledge_check_answered';
  selectedOptionId?: string;
  correct?: boolean;
  reflectionText?: string;
}) => void | Promise<void | BlockInteractionResult>;

type BlockEntry = {
  viewed?: boolean;
  interactionCompleted?: boolean;
  selectedOptionId?: string;
  correct?: boolean;
  reflectionText?: string;
};

function parseInlineMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let key = 0;
  let index = 0;

  while (index < text.length) {
    if (text.startsWith('**', index)) {
      const close = text.indexOf('**', index + 2);
      if (close !== -1) {
        parts.push(
          <strong key={key++}>{text.slice(index + 2, close)}</strong>,
        );
        index = close + 2;
        continue;
      }
    }

    if (text[index] === '*' && text[index + 1] !== '*') {
      const close = text.indexOf('*', index + 1);
      if (close !== -1 && text[close + 1] !== '*') {
        parts.push(<em key={key++}>{text.slice(index + 1, close)}</em>);
        index = close + 1;
        continue;
      }
    }

    const nextBold = text.indexOf('**', index);
    const nextItalic = text.indexOf('*', index);
    let next = text.length;
    if (nextBold !== -1) next = Math.min(next, nextBold);
    if (nextItalic !== -1) next = Math.min(next, nextItalic);
    parts.push(text.slice(index, next));
    index = next;
  }

  return parts.length === 1 ? parts[0] : parts;
}

function MarkdownLite({ body }: { body: string }) {
  const lines = body.split('\n');
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (!listItems.length) return;
    elements.push(
      <ul key={key++} className="ml-4 list-disc">
        {listItems.map((item, i) => (
          <li key={i}>{parseInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*(?:-\s+|\*\s+)(.*)$/);
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="mt-3 text-base font-semibold">
          {parseInlineMarkdown(line.slice(3))}
        </h3>,
      );
      continue;
    }
    if (bulletMatch) {
      listItems.push(bulletMatch[1] ?? '');
      continue;
    }
    flushList();
    if (!line.trim()) {
      elements.push(<br key={key++} />);
      continue;
    }
    elements.push(<p key={key++}>{parseInlineMarkdown(line)}</p>);
  }
  flushList();

  return <div className="prose prose-sm max-w-none text-slate-700">{elements}</div>;
}

function renderHeading(block: Extract<ContentBlock, { type: 'heading' }>) {
  const hashMatch = block.text.match(/^(#+)\s*(.*)$/);
  let text = block.text;
  let Tag: 'h2' | 'h3' | 'h4' = 'h2';
  let className = 'text-2xl font-bold';

  if (hashMatch?.[1] && hashMatch[2] != null) {
    const hashCount = hashMatch[1].length;
    text = hashMatch[2];
    if (hashCount === 1) {
      Tag = 'h2';
      className = 'text-2xl font-bold';
    } else if (hashCount === 2) {
      Tag = 'h3';
      className = 'text-xl font-semibold';
    } else {
      Tag = 'h4';
      className = 'text-lg font-semibold';
    }
  } else if (block.level === 1) {
    Tag = 'h2';
    className = 'text-2xl font-bold';
  } else if (block.level === 2) {
    Tag = 'h2';
    className = 'text-xl font-semibold';
  } else {
    Tag = 'h3';
    className = 'text-lg font-semibold';
  }

  return <Tag className={className}>{text}</Tag>;
}

const CALLOUT_STYLES = {
  info: 'border-blue-200 bg-blue-50 text-blue-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  tip: 'border-teal-200 bg-teal-50 text-teal-950',
  clinical: 'border-violet-200 bg-violet-50 text-violet-950',
} as const;

function getBlockAriaLabel(block: ContentBlock): string | undefined {
  if (block.accessibility?.ariaLabel) return block.accessibility.ariaLabel;

  switch (block.type) {
    case 'heading':
      return block.text;
    case 'text':
      return block.body.slice(0, 120) || undefined;
    case 'callout':
      return (block.title ?? block.body.slice(0, 120)) || undefined;
    case 'knowledge_check':
      return block.question;
    default:
      return undefined;
  }
}

function LessonAudioPlayer({
  src,
  onAudioPlayingChange,
}: {
  src: string;
  onAudioPlayingChange?: (playing: boolean) => void;
}) {
  const reportedPlayingRef = useRef(false);
  const onAudioPlayingChangeRef = useRef(onAudioPlayingChange);
  onAudioPlayingChangeRef.current = onAudioPlayingChange;

  const reportPlaying = useCallback((next: boolean) => {
    if (reportedPlayingRef.current === next) return;
    reportedPlayingRef.current = next;
    onAudioPlayingChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    reportPlaying(false);
    return () => reportPlaying(false);
  }, [src, reportPlaying]);

  return (
    <audio
      controls
      preload="metadata"
      className="mt-3 w-full"
      src={src}
      onPlay={() => reportPlaying(true)}
      onPlaying={() => reportPlaying(true)}
      onPause={() => reportPlaying(false)}
      onEnded={() => reportPlaying(false)}
    />
  );
}

export function ContentBlockView({
  block,
  progress,
  onViewed,
  onInteraction,
  onVideoPlayingChange,
  onAudioPlayingChange,
}: {
  block: ContentBlock;
  progress: LessonBlockProgress;
  onViewed: (blockId: string) => void;
  onInteraction: BlockInteractionHandler;
  onVideoPlayingChange?: (playing: boolean) => void;
  onAudioPlayingChange?: (playing: boolean) => void;
}) {
  const entry = progress.blocks[block.id];
  const a11y = block.accessibility;

  return (
    <BlockShell
      blockId={block.id}
      ariaLabel={getBlockAriaLabel(block)}
      onViewed={onViewed}
    >
      {renderBlockBody(
        block,
        entry,
        a11y,
        onInteraction,
        onVideoPlayingChange,
        onAudioPlayingChange,
      )}
    </BlockShell>
  );
}

function renderBlockBody(
  block: ContentBlock,
  entry: BlockEntry | undefined,
  a11y: ContentBlock['accessibility'],
  onInteraction: BlockInteractionHandler,
  onVideoPlayingChange?: (playing: boolean) => void,
  onAudioPlayingChange?: (playing: boolean) => void,
) {
  switch (block.type) {
    case 'heading':
      return renderHeading(block);

    case 'text':
      return <MarkdownLite body={block.body} />;

    case 'callout':
      return (
        <div
          className={`rounded-lg border p-4 ${CALLOUT_STYLES[block.variant]}`}
          role="note"
          aria-label={a11y?.ariaLabel ?? block.title}
        >
          {block.title ? <p className="font-semibold">{block.title}</p> : null}
          <MarkdownLite body={block.body} />
        </div>
      );

    case 'case_study':
      return (
        <article className="rounded-lg border bg-slate-50 p-4" aria-label={a11y?.ariaLabel}>
          <div className="mb-2 flex items-center gap-2 text-teal-800">
            <BookOpen className="h-4 w-4" aria-hidden />
            <h3 className="font-semibold">{block.title}</h3>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Resident profile</p>
          <p className="text-sm">{block.residentProfile}</p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Scenario</p>
          <p className="text-sm">{block.scenario}</p>
          {block.discussionPrompt ? (
            <p className="mt-3 text-sm italic text-teal-900">{block.discussionPrompt}</p>
          ) : null}
        </article>
      );

    case 'image':
    case 'infographic': {
      const imageSrc = 'src' in block ? block.src : null;
      return (
        <figure className="space-y-2">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(imageSrc)}
              alt={a11y?.altText ?? block.caption ?? ('title' in block && block.title ? block.title : 'Visual content')}
              className="w-full rounded-lg border border-slate-200 shadow-sm"
            />
          ) : (
            <div
              className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-slate-50 text-center"
              role="img"
              aria-label={a11y?.altText ?? block.caption ?? 'Visual content'}
            >
              {block.type === 'infographic' ? (
                <LayoutGrid className="h-10 w-10 text-teal-700/40" aria-hidden />
              ) : (
                <ImageIcon className="h-10 w-10 text-teal-700/40" aria-hidden />
              )}
              {'title' in block && block.title ? (
                <p className="text-sm font-medium">{block.title}</p>
              ) : null}
              {'description' in block ? (
                <p className="max-w-lg px-4 text-xs text-muted-foreground">{block.description}</p>
              ) : null}
            </div>
          )}
          {block.caption ? (
            <figcaption className="text-center text-xs text-muted-foreground">
              {block.caption}
            </figcaption>
          ) : null}
          {a11y?.transcriptPlaceholder ? (
            <p className="text-xs text-muted-foreground">{a11y.transcriptPlaceholder}</p>
          ) : null}
        </figure>
      );
    }

    case 'video':
      return (
        <VideoBlock
          block={block}
          watched={!!(entry?.interactionCompleted || entry?.viewed)}
          onEnded={() => {
            onInteraction({
              blockId: block.id,
              eventType: 'interaction_completed',
              selectedOptionId: 'watched',
            });
          }}
          onComplete={() => {
            onInteraction({
              blockId: block.id,
              eventType: 'interaction_completed',
              selectedOptionId: 'watched',
            });
          }}
          onVideoPlayingChange={onVideoPlayingChange}
        />
      );

    case 'audio':
      return (
        <div
          className="rounded-lg border bg-muted/50 p-4"
          role="region"
          aria-label={a11y?.ariaLabel ?? block.title ?? 'Audio narration'}
        >
          <div className="flex items-center gap-2 font-medium">
            <Headphones className="h-4 w-4" aria-hidden />
            {block.title}
          </div>
          {block.audioUrl ? (
            <LessonAudioPlayer
              src={mediaUrl(block.audioUrl)}
              onAudioPlayingChange={onAudioPlayingChange}
            />
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{block.placeholderNote}</p>
          )}
          {a11y?.transcriptPlaceholder ? (
            <p className="mt-2 text-xs text-muted-foreground">{a11y.transcriptPlaceholder}</p>
          ) : null}
        </div>
      );

    case 'scenario_question':
      return <ScenarioBlock block={block} entry={entry} onInteraction={onInteraction} />;

    case 'knowledge_check':
      return <KnowledgeCheckBlock block={block} entry={entry} onInteraction={onInteraction} />;

    case 'true_false_challenge':
      return (
        <TrueFalseChallengeBlock block={block} entry={entry} onInteraction={onInteraction} />
      );

    case 'arrange':
      return <ArrangeGameBlock block={block} entry={entry} onInteraction={onInteraction} />;

    case 'trivia_card':
      return <TriviaCardBlock block={block} entry={entry} onInteraction={onInteraction} />;

    case 'reflection':
      return <ReflectionBlock block={block} entry={entry} onInteraction={onInteraction} />;

    case 'summary':
      return (
        <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4" role="region">
          <div className="mb-2 flex items-center gap-2 font-semibold text-teal-900">
            <Lightbulb className="h-4 w-4" aria-hidden />
            {block.title ?? 'Summary'}
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-teal-950">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case 'matching':
    case 'reveal_card':
    case 'hotspot_image':
      return (
        <PlaceholderInteractive block={block} entry={entry} onInteraction={onInteraction} />
      );

    default:
      return null;
  }
}

function ScenarioBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'scenario_question' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const locked = !!entry?.interactionCompleted && entry?.correct === true;
  const [selected, setSelected] = useState<string | null>(entry?.selectedOptionId ?? null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function choose(optionId: string, fb: string, recommended?: boolean) {
    setSelected(optionId);
    setFeedback(fb);
    if (!recommended) return;
    onInteraction({
      blockId: block.id,
      eventType: 'interaction_completed',
      selectedOptionId: optionId,
      correct: true,
    });
  }

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="text-sm font-semibold">{block.prompt}</legend>
      {block.context ? <p className="text-sm text-muted-foreground">{block.context}</p> : null}
      <div className="space-y-2" role="radiogroup" aria-label={block.prompt}>
        {block.options.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer gap-3 rounded-md border p-3 ${
              selected === opt.id ? 'border-teal-600 bg-teal-50/50' : ''
            }`}
          >
            <input
              type="radio"
              name={`scenario-${block.id}`}
              value={opt.id}
              checked={selected === opt.id}
              disabled={locked}
              onChange={() => choose(opt.id, opt.feedback, opt.isRecommended)}
              className="mt-1"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
      {feedback ? (
        <p className="text-sm text-teal-900" role="status">
          {feedback}
        </p>
      ) : null}
    </fieldset>
  );
}

function ArrangeGameBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'arrange' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const question = block.question ?? '';
  const items = block.items ?? [];
  const correctOrder = block.correctOrder ?? [];
  const explanation = block.explanation ?? '';

  const locked = !!entry?.interactionCompleted && entry?.correct === true;
  const initialOrder = entry?.selectedOptionId
    ? entry.selectedOptionId.split(',')
    : undefined;

  return (
    <ArrangeGame
      question={question}
      items={items}
      correctOrder={correctOrder}
      explanation={explanation}
      locked={locked}
      initialOrder={initialOrder}
      onComplete={({ correct, order }) => {
        if (!correct) return;
        onInteraction({
          blockId: block.id,
          eventType: 'interaction_completed',
          selectedOptionId: order.join(','),
          correct: true,
        });
      }}
    />
  );
}

function TriviaCardBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'trivia_card' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const title = block.title ?? 'Did You Know?';
  const fact = block.body ?? '';
  const locked = !!entry?.interactionCompleted;

  return (
    <TriviaCard
      title={title}
      fact={fact}
      locked={locked}
      onComplete={() => {
        onInteraction({
          blockId: block.id,
          eventType: 'interaction_completed',
        });
      }}
    />
  );
}

function TrueFalseChallengeBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'true_false_challenge' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const locked = !!entry?.interactionCompleted && entry?.correct === true;
  const initialAnswer =
    entry?.selectedOptionId === 'true'
      ? true
      : entry?.selectedOptionId === 'false'
        ? false
        : undefined;

  return (
    <TrueFalseChallenge
      question={block.prompt}
      isTrue={block.correctAnswer === 'true'}
      explanation={block.explanation}
      locked={locked}
      initialAnswer={initialAnswer}
      onAnswer={({ answer, correct }) => {
        if (!correct) return;
        onInteraction({
          blockId: block.id,
          eventType: 'interaction_completed',
          selectedOptionId: answer ? 'true' : 'false',
          correct: true,
        });
      }}
    />
  );
}

function KnowledgeCheckBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'knowledge_check' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const correctOptionIndex = block.options.findIndex(
    (opt) => opt.id === block.correctOptionId,
  );
  const locked = !!entry?.interactionCompleted && entry?.correct === true;
  const initialSelectedIndex =
    entry?.selectedOptionId != null
      ? block.options.findIndex((opt) => opt.id === entry.selectedOptionId)
      : undefined;

  return (
    <KnowledgeCheck
      question={block.question}
      options={block.options.map((opt) => opt.label)}
      correctOptionIndex={correctOptionIndex >= 0 ? correctOptionIndex : 0}
      explanation={block.explanation}
      locked={locked}
      initialSelectedIndex={
        initialSelectedIndex != null && initialSelectedIndex >= 0
          ? initialSelectedIndex
          : undefined
      }
      onAnswer={({ optionIndex, correct }) => {
        if (!correct) return;
        const option = block.options[optionIndex];
        if (!option) return;
        onInteraction({
          blockId: block.id,
          eventType: 'knowledge_check_answered',
          selectedOptionId: option.id,
          correct: true,
        });
      }}
    />
  );
}

function ReflectionBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'reflection' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const minCharacters = block.minCharacters ?? 1;
  const hintId = `reflection-hint-${block.id}`;
  const errorId = `reflection-error-${block.id}`;
  const [text, setText] = useState(entry?.reflectionText ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!entry?.interactionCompleted);

  const completed = saved || !!entry?.interactionCompleted;
  const remaining = Math.max(0, minCharacters - text.trim().length);
  const underMin = remaining > 0;

  async function submit() {
    if (underMin || saving || completed) return;

    setSaving(true);
    setError(null);
    try {
      const result = await onInteraction({
        blockId: block.id,
        eventType: 'interaction_completed',
        reflectionText: text.trim(),
      });
      if (result && result.ok === false) {
        setError("Couldn't save your reflection. Please try again.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Couldn't save your reflection. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`reflection-${block.id}`} className="text-sm font-medium">
        {block.prompt}
      </label>
      <textarea
        id={`reflection-${block.id}`}
        className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
        placeholder={block.placeholder}
        value={text}
        disabled={completed}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        aria-describedby={[underMin || minCharacters > 1 ? hintId : null, error ? errorId : null]
          .filter(Boolean)
          .join(' ') || undefined}
      />
      {underMin ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {remaining} more character{remaining === 1 ? '' : 's'} needed
        </p>
      ) : block.minCharacters ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          Minimum {block.minCharacters} characters
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {!completed ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void submit()}
          disabled={underMin || saving}
        >
          {saving ? 'Saving…' : 'Save reflection'}
        </Button>
      ) : (
        <p className="text-xs text-teal-800" role="status">
          Reflection saved
        </p>
      )}
    </div>
  );
}

function RevealCardBlock({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<ContentBlock, { type: 'reveal_card' }>;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border p-4">
      <button
        type="button"
        className="w-full text-left font-medium"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open && !entry?.interactionCompleted) {
            onInteraction({ blockId: block.id, eventType: 'interaction_completed' });
          }
        }}
      >
        {open ? block.backTitle : block.frontTitle}
      </button>
      <p className="mt-2 text-sm text-muted-foreground">
        {open ? block.backBody : block.frontBody}
      </p>
    </div>
  );
}

function PlaceholderInteractive({
  block,
  entry,
  onInteraction,
}: {
  block: Extract<
    ContentBlock,
    {
      type: 'matching' | 'reveal_card' | 'hotspot_image';
    }
  >;
  entry?: BlockEntry;
  onInteraction: BlockInteractionHandler;
}) {
  const labels: Record<string, string> = {
    matching: 'Matching activity',
    reveal_card: 'Reveal card',
    hotspot_image: 'Hotspot image',
  };

  if (block.type === 'reveal_card') {
    return <RevealCardBlock block={block} entry={entry} onInteraction={onInteraction} />;
  }

  return (
    <div className="rounded-lg border border-dashed p-4 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden />
        {labels[block.type]}
      </div>
      {'prompt' in block && typeof block.prompt === 'string' ? (
        <p className="mt-2 text-muted-foreground">{block.prompt}</p>
      ) : null}
      <p className="mt-2 text-muted-foreground">
        {'instructions' in block ? block.instructions : ''}
      </p>
      <p className="mt-1 text-xs">{block.placeholderNote}</p>
      {!entry?.interactionCompleted ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() =>
            onInteraction({ blockId: block.id, eventType: 'interaction_completed' })
          }
        >
          Mark activity reviewed
        </Button>
      ) : null}
    </div>
  );
}
