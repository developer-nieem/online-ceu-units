'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@calace/ui/components/ui/button';
import { cn } from '@calace/ui/lib/utils';
import { CheckCircle2, ListOrdered, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

export type ArrangeGameItem = {
  id: string;
  text: string;
};

export type ArrangeGameProps = {
  question: string;
  items: ArrangeGameItem[];
  correctOrder: string[];
  explanation: string;
  /** When true, the activity is already completed and locked in the success state. */
  locked?: boolean;
  /** Previously submitted order when restoring completed state. */
  initialOrder?: string[];
  onComplete?: (params: { correct: boolean; order: string[] }) => void;
};

type Outcome = 'idle' | 'incorrect' | 'correct';

function buildOrderFromItems(items?: ArrangeGameItem[]): string[] {
  return (items ?? []).map((item) => item.id);
}

function orderItemsByIds(items: ArrangeGameItem[] | undefined, order: string[]): ArrangeGameItem[] {
  const byId = new Map((items ?? []).map((item) => [item.id, item]));
  return order.map((id) => byId.get(id)).filter((item): item is ArrangeGameItem => !!item);
}

function SortableCard({
  item,
  index,
  disabled,
  showWrong,
  showCorrect,
}: {
  item: ArrangeGameItem;
  index: number;
  disabled: boolean;
  showWrong: boolean;
  showCorrect: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors',
        isDragging && 'z-10 shadow-md',
        showCorrect
          ? 'border-emerald-400 bg-emerald-100/80 text-emerald-950'
          : showWrong
            ? 'border-red-400 bg-red-100/80 text-red-950'
            : 'border-slate-200 bg-white text-slate-800',
        disabled && !showCorrect && 'opacity-70',
      )}
    >
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-base leading-none',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            : 'cursor-grab border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300 hover:bg-teal-50 active:cursor-grabbing',
        )}
        aria-label={`Drag step ${index + 1}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden>☰</span>
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 leading-relaxed">{item.text}</span>
      {showCorrect ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      ) : showWrong ? (
        <XCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
      ) : null}
    </li>
  );
}

export function ArrangeGame({
  question = '',
  items = [],
  correctOrder = [],
  explanation = '',
  locked = false,
  initialOrder,
  onComplete,
}: ArrangeGameProps) {
  const resolvedInitialOrder = useMemo(() => {
    if (locked) {
      return initialOrder?.length ? initialOrder : correctOrder;
    }
    return buildOrderFromItems(items);
  }, [items, initialOrder, locked, correctOrder]);

  const [order, setOrder] = useState<string[]>(resolvedInitialOrder);
  const [outcome, setOutcome] = useState<Outcome>(locked ? 'correct' : 'idle');

  const isLocked = locked || outcome === 'correct';
  const orderedItems = useMemo(() => orderItemsByIds(items, order), [items, order]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (isLocked) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
    setOutcome('idle');
  }

  function checkAnswer() {
    if (isLocked) return;

    const isCorrect = order.every((id, index) => id === correctOrder[index]);
    if (isCorrect) {
      setOutcome('correct');
      onComplete?.({ correct: true, order });
      return;
    }

    setOutcome('incorrect');
    onComplete?.({ correct: false, order });
  }

  function tryAgain() {
    if (isLocked) return;
    setOutcome('idle');
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 transition-colors',
        outcome === 'correct'
          ? 'border-emerald-300 bg-emerald-50/80'
          : outcome === 'incorrect'
            ? 'border-red-200 bg-red-50/60'
            : 'border-sky-200 bg-sky-50/50',
      )}
      role="group"
      aria-labelledby="arrange-game-prompt"
    >
      <div className="mb-4 flex items-start gap-2">
        {outcome === 'correct' ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <ListOrdered className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p
            id="arrange-game-prompt"
            className="text-xs font-semibold uppercase tracking-wide text-sky-900/70"
          >
            Arrange in order
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">{question}</p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2" aria-label="Steps to arrange">
            {orderedItems.map((item, index) => {
              const isWrongPosition =
                outcome === 'incorrect' && order[index] !== correctOrder[index];
              const isCorrectPosition =
                outcome === 'correct' && order[index] === correctOrder[index];

              return (
                <SortableCard
                  key={item.id}
                  item={item}
                  index={index}
                  disabled={isLocked}
                  showWrong={isWrongPosition}
                  showCorrect={isCorrectPosition}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>

      {outcome === 'incorrect' ? (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-white/80 px-4 py-3"
          role="status"
        >
          <div className="flex items-start gap-2 text-sm text-red-900">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>Not quite — reorder the highlighted steps and try again.</span>
          </div>
          <button
            type="button"
            onClick={tryAgain}
            className="shrink-0 rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-900 transition-colors hover:bg-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Try again
          </button>
        </div>
      ) : null}

      {outcome === 'correct' ? (
        <div
          className="mt-4 rounded-lg border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          <p className="font-semibold text-emerald-800">Correct!</p>
          <p className="mt-1 leading-relaxed">{explanation}</p>
        </div>
      ) : null}

      {!isLocked ? (
        <Button type="button" size="sm" className="mt-4" onClick={checkAnswer}>
          Check Answer
        </Button>
      ) : null}
    </div>
  );
}
