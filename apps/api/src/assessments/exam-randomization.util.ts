import type { QuestionOption } from './assessment.types';

/** Fisher–Yates shuffle (mutates copy). */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export type RandomizedExamSelection<T extends { id: string; options?: unknown }> = {
  selected: T[];
  optionOrders: Record<string, string[]>;
};

export type ExamRandomizationOptions = {
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
};

/**
 * Anti-cheating presentation: shuffle question order and option order on every exam start.
 * Grading must use stable option IDs from optionOrders, never array indices.
 * Source question records in the database are never mutated — only the attempt payload.
 */
export function randomizeExamQuestions<T extends { id: string; options?: unknown }>(
  bank: T[],
  questionCount: number,
  options: ExamRandomizationOptions = {},
): RandomizedExamSelection<T> {
  const randomizeQuestions = options.randomizeQuestions !== false;
  const randomizeOptions = options.randomizeOptions !== false;

  const pool = randomizeQuestions ? shuffleArray(bank) : [...bank];
  const selected = pool.slice(0, questionCount);
  const optionOrders: Record<string, string[]> = {};

  for (const question of selected) {
    const questionOptions = (question.options ?? []) as QuestionOption[];
    const orderedIds = questionOptions.map((o) => o.id);
    optionOrders[question.id] = randomizeOptions
      ? shuffleArray(orderedIds)
      : orderedIds;
  }

  return { selected, optionOrders };
}

export function mapPresentedOptions(
  options: QuestionOption[],
  orderedIds: string[],
): QuestionOption[] {
  return orderedIds.map((id) => options.find((o) => o.id === id)!);
}
