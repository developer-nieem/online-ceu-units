import { Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentKind, Prisma } from '@calace/db';

import { DEFAULT_FINAL_EXAM_SETTINGS } from '../assessments/assessment.types';
import { CmsBaseService } from './cms-base.service';
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
} from './dto/assessment.dto';

@Injectable()
export class CmsAssessmentsService extends CmsBaseService {
  async listForVersion(courseId: string, versionId: string) {
    await this.getVersionForCourse(versionId, courseId);
    const assessments = await this.prisma.assessment.findMany({
      where: { courseVersionId: versionId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return assessments.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      kind: a.kind,
      passingScore: a.passingScore ? Number(a.passingScore) : null,
      maxAttempts: a.maxAttempts,
      settings: a.settings,
      questionCount: a.questions.length,
      questions: a.questions.map((q) => ({
        id: q.id,
        sortOrder: q.sortOrder,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        metadata: q.metadata,
      })),
    }));
  }

  async createAssessment(courseId: string, versionId: string, dto: CreateAssessmentDto) {
    await this.assertDraftEditable(versionId);
    await this.getVersionForCourse(versionId, courseId);
    const slug = dto.slug?.trim() || this.slugify(dto.title);
    const settings =
      dto.kind === AssessmentKind.FINAL_EXAM || !dto.kind
        ? { ...DEFAULT_FINAL_EXAM_SETTINGS, ...(dto.settings ?? {}) }
        : (dto.settings ?? {});

    return this.prisma.assessment.create({
      data: {
        courseVersionId: versionId,
        slug,
        title: dto.title,
        kind: dto.kind ?? AssessmentKind.FINAL_EXAM,
        passingScore: dto.passingScore ?? 80,
        maxAttempts: dto.maxAttempts ?? 3,
        settings: settings as Prisma.InputJsonValue,
      },
    });
  }

  async updateAssessment(assessmentId: string, dto: UpdateAssessmentDto) {
    const assessment = await this.getAssessment(assessmentId);
    await this.assertDraftEditable(assessment.courseVersionId!);
    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        title: dto.title,
        passingScore: dto.passingScore,
        maxAttempts: dto.maxAttempts,
        settings: dto.settings as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async createQuestion(assessmentId: string, dto: CreateQuestionDto) {
    const assessment = await this.getAssessment(assessmentId);
    await this.assertDraftEditable(assessment.courseVersionId!);
    const maxOrder = await this.prisma.question.aggregate({
      where: { assessmentId, deletedAt: null },
      _max: { sortOrder: true },
    });
    return this.prisma.question.create({
      data: {
        assessmentId,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        type: dto.type,
        prompt: dto.prompt,
        options: (dto.options ?? []) as Prisma.InputJsonValue,
        correctAnswer: dto.correctAnswer as Prisma.InputJsonValue,
        explanation: dto.explanation,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
      include: { assessment: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertDraftEditable(question.assessment.courseVersionId!);
    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        type: dto.type,
        prompt: dto.prompt,
        options: dto.options as Prisma.InputJsonValue | undefined,
        correctAnswer: dto.correctAnswer as Prisma.InputJsonValue | undefined,
        explanation: dto.explanation,
        sortOrder: dto.sortOrder,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
      include: { assessment: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertDraftEditable(question.assessment.courseVersionId!);
    await this.prisma.question.update({
      where: { id: questionId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  private async getAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null },
    });
    if (!assessment?.courseVersionId) {
      throw new NotFoundException('Assessment not found');
    }
    return assessment;
  }
}
