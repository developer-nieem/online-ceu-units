import type { CmsAssessmentQuestion, CmsQuestionType } from './types';

export function scoreResponses(
  questions: CmsAssessmentQuestion[],
  responses: Record<string, { optionId?: string; value?: boolean }>,
): { score: number; correctCount: number; total: number } {
  const gradable = questions.filter((q) => q.correctAnswer);
  const total = gradable.length;

  if (total === 0) {
    return { score: 100, correctCount: 0, total: 0 };
  }

  let correctCount = 0;

  for (const question of gradable) {
    const response = responses[question.id];
    if (!response) continue;

    if (question.type === 'true_false') {
      const expected = question.correctAnswer?.value;
      if (typeof expected === 'boolean' && response.value === expected) {
        correctCount += 1;
      }
      continue;
    }

    const expectedOptionId = question.correctAnswer?.optionId;
    if (expectedOptionId && response.optionId === expectedOptionId) {
      correctCount += 1;
    }
  }

  const score = Math.round((correctCount / total) * 100);
  return { score, correctCount, total };
}

export function responseFromForm(
  type: CmsQuestionType,
  value: string,
): { optionId?: string; value?: boolean } {
  if (type === 'true_false') {
    return { value: value === 'true' };
  }
  return { optionId: value };
}
