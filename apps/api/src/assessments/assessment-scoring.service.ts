import { Injectable } from '@nestjs/common';
import { QuestionType } from '@calace/db';

import type {
  GradedQuestionResult,
  LearnerAnswerValue,
  QuestionOption,
} from './assessment.types';

type QuestionRow = {
  id: string;
  type: QuestionType;
  options: unknown;
  correctAnswer: unknown;
  points: { toString(): string };
  explanation: string | null;
  metadata: unknown;
};

@Injectable()
export class AssessmentScoringService {
  gradeAttempt(
    questions: QuestionRow[],
    answers: Record<string, LearnerAnswerValue>,
  ): {
    results: GradedQuestionResult[];
    scorePct: number;
    passed: boolean;
    passingScore: number;
  } {
    let earned = 0;
    let possible = 0;
    const results: GradedQuestionResult[] = [];

    for (const q of questions) {
      const pointsPossible = Number(q.points);
      possible += pointsPossible;
      const options = (q.options ?? []) as QuestionOption[];
      const learnerAnswer = answers[q.id] ?? null;
      const correct = this.isCorrect(q, learnerAnswer);
      const pointsEarned = correct ? pointsPossible : 0;
      earned += pointsEarned;

      const meta = (q.metadata ?? {}) as { remediation?: string };
      results.push({
        questionId: q.id,
        correct,
        pointsEarned,
        pointsPossible,
        explanation: q.explanation,
        remediation: meta.remediation ?? (correct ? null : q.explanation),
        learnerAnswer,
        correctAnswerSummary: this.summarizeCorrectAnswer(q, options),
      });
    }

    const scorePct = possible > 0 ? Math.round((earned / possible) * 10000) / 100 : 0;
    return {
      results,
      scorePct,
      passed: false,
      passingScore: 0,
    };
  }

  finalizePassFail(scorePct: number, passingScore: number) {
    return {
      scorePct,
      passed: scorePct >= passingScore,
      passingScore,
    };
  }

  private isCorrect(q: QuestionRow, answer: LearnerAnswerValue | null): boolean {
    if (answer === null || answer === undefined) return false;
    const correct = q.correctAnswer;

    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      const expected = this.normalizeMulti(correct);
      const given = this.normalizeMulti(answer);
      if (expected.length !== given.length) return false;
      return expected.every((id) => given.includes(id));
    }

    const expectedId = this.normalizeSingle(correct);
    const givenId = this.normalizeSingle(answer);
    return Boolean(expectedId && givenId && expectedId === givenId);
  }

  private normalizeSingle(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value && 'optionId' in value) {
      return String((value as { optionId: string }).optionId);
    }
    return null;
  }

  private normalizeMulti(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String).sort();
    if (typeof value === 'string') return [value];
    return [];
  }

  private summarizeCorrectAnswer(q: QuestionRow, options: QuestionOption[]): string | null {
    const correct = q.correctAnswer;
    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      const ids = this.normalizeMulti(correct);
      return ids
        .map((id) => options.find((o) => o.id === id)?.label ?? id)
        .join('; ');
    }
    const id = this.normalizeSingle(correct);
    return options.find((o) => o.id === id)?.label ?? id;
  }
}
