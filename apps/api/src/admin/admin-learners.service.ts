import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, CertificateStatus, Prisma } from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditService } from '../audit/audit.service';
import { ComplianceService } from '../credentials/compliance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminBaseService } from './admin-base.service';
import type { CorrectLearnerNameDto } from './dto/correct-learner-name.dto';
import {
  ENROLLED_STUDENTS_PAGE_SIZE,
  enrollmentPlanLabels,
  mergePlanLabels,
  nonTestStudentWhere,
} from './enrolled-students';

@Injectable()
export class AdminLearnersService extends AdminBaseService {
  constructor(
    prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly audit: AuditService,
  ) {
    super(prisma);
  }

  async listLearners(params?: { search?: string; limit?: number }) {
    const tenantId = await this.getTenantId();
    const limit = Math.min(params?.limit ?? 50, 100);
    const where: Prisma.UserWhereInput = this.learnerUserWhere(tenantId);

    if (params?.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: { where: { deletedAt: null } },
            certificates: { where: { status: CertificateStatus.ISSUED } },
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      status: u.status,
      emailVerified: Boolean(u.emailVerifiedAt),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      enrollmentCount: u._count.enrollments,
      certificateCount: u._count.certificates,
    }));
  }

  /**
   * Every student with an enrollment record, for any plan.
   * Students are distinct people. Enrollments are records, so one person in several courses counts once as a student.
   */
  async listEnrolledStudents(params?: { search?: string; page?: number }) {
    const tenantId = await this.getTenantId();
    const search = params?.search?.trim() ?? '';
    const requestedPage =
      typeof params?.page === 'number' && Number.isFinite(params.page) && params.page >= 1
        ? Math.floor(params.page)
        : 1;

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      tenantId,
      deletedAt: null,
      user: { is: nonTestStudentWhere() },
    };
    const allStudentsWhere = this.enrolledStudentWhere(tenantId);
    const listWhere = search ? this.enrolledStudentWhere(tenantId, search) : allStudentsWhere;

    const [totalEnrolledStudents, totalEnrollments] = await Promise.all([
      this.prisma.user.count({ where: allStudentsWhere }),
      this.prisma.enrollment.count({ where: enrollmentWhere }),
    ]);

    let listedStudents = totalEnrolledStudents;
    let matchingEnrollments = totalEnrollments;
    if (search) {
      [listedStudents, matchingEnrollments] = await Promise.all([
        this.prisma.user.count({ where: listWhere }),
        this.prisma.enrollment.count({
          where: {
            ...enrollmentWhere,
            user: {
              is: {
                AND: [{ OR: this.studentSearchOr(search) }, nonTestStudentWhere()],
              },
            },
          },
        }),
      ]);
    }

    const pageCount = Math.max(1, Math.ceil(listedStudents / ENROLLED_STUDENTS_PAGE_SIZE));
    const page = Math.min(requestedPage, pageCount);

    const users = await this.prisma.user.findMany({
      where: listWhere,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { email: 'asc' }],
      skip: (page - 1) * ENROLLED_STUDENTS_PAGE_SIZE,
      take: ENROLLED_STUDENTS_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            enrollments: { where: enrollmentWhere },
          },
        },
        enrollments: {
          where: enrollmentWhere,
          orderBy: { enrolledAt: 'desc' },
          select: { enrolledAt: true, metadata: true },
        },
      },
    });

    return {
      totalEnrolledStudents,
      totalEnrollments,
      students: users.map((user) => ({
        userId: user.id,
        fullName: [user.firstName, user.lastName]
          .map((part) => part?.trim())
          .filter((part): part is string => Boolean(part))
          .join(' '),
        email: user.email,
        enrollmentCount: user._count.enrollments,
        plans: mergePlanLabels(
          user.enrollments.map((enrollment) => enrollmentPlanLabels(enrollment.metadata)),
        ),
        latestEnrolledAt: user.enrollments[0]?.enrolledAt.toISOString() ?? null,
      })),
      page,
      pageSize: ENROLLED_STUDENTS_PAGE_SIZE,
      pageCount,
      ...(search
        ? { matchingStudents: listedStudents, matchingEnrollments }
        : {}),
    };
  }

  private enrolledStudentWhere(tenantId: string, search = ''): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      tenantId,
      enrollments: { some: { tenantId, deletedAt: null } },
      AND: [nonTestStudentWhere()],
    };
    if (search) where.OR = this.studentSearchOr(search);
    return where;
  }

  private studentSearchOr(search: string): Prisma.UserWhereInput[] {
    return [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  async getLearnerDetail(userId: string) {
    const tenantId = await this.getTenantId();
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
        learnerProfile: { include: { jurisdiction: true, profession: true } },
        enrollments: {
          where: { deletedAt: null },
          orderBy: { enrolledAt: 'desc' },
          include: {
            courseVersion: {
              include: { course: { select: { slug: true, title: true, ceHours: true } } },
            },
            completions: { include: { certificate: true } },
          },
        },
        certificates: {
          orderBy: { issuedAt: 'desc' },
          include: {
            verificationToken: true,
            completion: {
              include: {
                courseVersion: {
                  include: { course: { select: { slug: true, title: true } } },
                },
              },
            },
          },
        },
        transcriptEntries: { orderBy: { completedOn: 'desc' }, take: 50 },
      },
    });

    if (!user) throw new NotFoundException('Learner not found');

    let complianceSummary = null;
    try {
      complianceSummary = await this.compliance.getSummaryForUser(user.id, tenantId);
    } catch {
      complianceSummary = { error: 'Compliance summary unavailable' };
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      roles: user.userRoles.map((ur) => ur.role.slug),
      profile: user.learnerProfile
        ? {
            jurisdiction: user.learnerProfile.jurisdiction?.name ?? null,
            profession: user.learnerProfile.profession?.name ?? null,
            onboardingComplete: user.learnerProfile.onboardingComplete,
          }
        : null,
      enrollments: user.enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        courseSlug: e.courseVersion.course.slug,
        courseTitle: e.courseVersion.course.title,
        ceHours: Number(e.courseVersion.course.ceHours),
        progressPct: Number((e.metadata as { progressPct?: number })?.progressPct ?? 0),
        completion: e.completions[0]
          ? {
              status: e.completions[0].status,
              ceHoursEarned: Number(e.completions[0].ceHoursEarned),
              completedAt: e.completions[0].completedAt.toISOString(),
            }
          : null,
      })),
      certificates: user.certificates.map((c) => {
        const payload = (c.payload ?? {}) as Record<string, unknown>;
        return {
          id: c.id,
          certificateNo: c.certificateNo,
          status: c.status,
          issuedAt: c.issuedAt?.toISOString() ?? null,
          verificationCode: c.verificationToken?.token ?? null,
          courseTitle: c.completion.courseVersion.course.title,
          learnerName: typeof payload.learnerName === 'string' ? payload.learnerName : null,
          onlineCeuHours: payload.onlineCeuHours ?? payload.ceuHours,
          onlineCeuHoursLabel: payload.onlineCeuHoursLabel,
        };
      }),
      transcript: user.transcriptEntries.map((t) => ({
        id: t.id,
        title: t.title,
        ceHours: Number(t.ceHours),
        completedOn: t.completedOn.toISOString().slice(0, 10),
        entryType: t.entryType,
      })),
      compliance: complianceSummary,
    };
  }

  async correctLegalName(userId: string, actor: AuthUser, dto: CorrectLearnerNameDto) {
    const tenantId = await this.getTenantId();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const reason = dto.reason.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException('First name and last name are required');
    }
    if (!reason) {
      throw new BadRequestException('A reason is required for legal-name corrections');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundException('Learner not found');

    const beforeName = { firstName: user.firstName, lastName: user.lastName };
    const requestedIds = [...new Set((dto.applyToCertificateIds ?? []).filter(Boolean))];

    const requestedCerts =
      requestedIds.length > 0
        ? await this.prisma.certificate.findMany({
            where: { id: { in: requestedIds } },
            select: {
              id: true,
              userId: true,
              status: true,
              certificateNo: true,
              payload: true,
            },
          })
        : [];
    const certById = new Map(requestedCerts.map((c) => [c.id, c]));

    const skipped: Array<{ id: string; reason: string }> = [];
    const eligible: typeof requestedCerts = [];

    for (const id of requestedIds) {
      const cert = certById.get(id);
      if (!cert) {
        skipped.push({ id, reason: 'not_found' });
        continue;
      }
      if (cert.userId !== user.id) {
        skipped.push({ id, reason: 'other_user' });
        continue;
      }
      if (cert.status !== CertificateStatus.ISSUED) {
        skipped.push({ id, reason: 'not_issued' });
        continue;
      }
      eligible.push(cert);
    }

    const newLearnerName = [firstName, lastName].filter(Boolean).join(' ') || user.email;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { firstName, lastName },
      });

      for (const cert of eligible) {
        const existingPayload = this.asPayloadObject(cert.payload);
        const nextPayload = { ...existingPayload, learnerName: newLearnerName };
        await tx.certificate.update({
          where: { id: cert.id },
          data: { payload: nextPayload as Prisma.InputJsonValue },
        });
      }
    });

    await this.audit.log({
      tenantId,
      actorId: actor.userId,
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: user.id,
      before: beforeName,
      after: { firstName, lastName },
      metadata: {
        reason,
        idVerified: dto.idVerified,
        correctionType: 'legal_name',
      },
    });

    const certificatesCorrected: Array<{
      id: string;
      certificateNo: string;
      learnerName: string;
    }> = [];

    for (const cert of eligible) {
      const existingPayload = this.asPayloadObject(cert.payload);
      const oldLearnerName =
        typeof existingPayload.learnerName === 'string' ? existingPayload.learnerName : null;

      await this.audit.log({
        tenantId,
        actorId: actor.userId,
        action: AuditAction.UPDATE,
        entityType: 'certificate',
        entityId: cert.id,
        before: { learnerName: oldLearnerName },
        after: { learnerName: newLearnerName },
        metadata: {
          reason,
          idVerified: dto.idVerified,
          certificateNo: cert.certificateNo,
          correctionType: 'certificate_name',
        },
      });

      certificatesCorrected.push({
        id: cert.id,
        certificateNo: cert.certificateNo,
        learnerName: newLearnerName,
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
      },
      certificatesCorrected,
      certificatesSkipped: skipped,
    };
  }

  async listExamAttempts(userId: string) {
    const tenantId = await this.getTenantId();
    await this.requireTenantUser(userId, tenantId);

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { userId, user: { tenantId, deletedAt: null } },
      orderBy: [{ startedAt: 'desc' }, { attemptNum: 'desc' }],
      select: {
        id: true,
        attemptNum: true,
        status: true,
        score: true,
        startedAt: true,
        submittedAt: true,
        gradedAt: true,
        assessment: {
          select: {
            slug: true,
            title: true,
            courseVersion: {
              select: { course: { select: { slug: true, title: true } } },
            },
          },
        },
        enrollment: {
          select: {
            courseVersion: {
              select: { course: { select: { slug: true, title: true } } },
            },
          },
        },
      },
    });

    return attempts.map((attempt) => this.mapExamAttemptSummary(attempt));
  }

  async getExamAttempt(userId: string, attemptId: string) {
    const tenantId = await this.getTenantId();
    await this.requireTenantUser(userId, tenantId);

    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, userId, user: { tenantId, deletedAt: null } },
      select: {
        id: true,
        attemptNum: true,
        status: true,
        score: true,
        startedAt: true,
        submittedAt: true,
        gradedAt: true,
        responses: true,
        metadata: true,
        assessment: {
          select: {
            slug: true,
            title: true,
            courseVersion: {
              select: { course: { select: { slug: true, title: true } } },
            },
          },
        },
        enrollment: {
          select: {
            courseVersion: {
              select: { course: { select: { slug: true, title: true } } },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Exam attempt not found');

    const parsed = this.parseAttemptPresentation(attempt.metadata, attempt.responses);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: parsed.questionIds } },
      select: { id: true, prompt: true, options: true },
    });
    const questionById = new Map(questions.map((question) => [question.id, question]));

    return {
      ...this.mapExamAttemptSummary(attempt),
      questions: parsed.questionIds.map((questionId) => {
        const bank = questionById.get(questionId);
        const options = this.asQuestionOptions(bank?.options);
        const labelById = new Map(options.map((option) => [option.id, option.label]));
        const presentedOrder = parsed.optionOrders[questionId] ?? options.map((option) => option.id);
        const graded = parsed.gradedByQuestionId.get(questionId);
        const learnerAnswer = graded?.learnerAnswer ?? parsed.responses[questionId] ?? null;

        return {
          questionId,
          prompt: bank?.prompt ?? null,
          options: presentedOrder.map((optionId) => ({
            id: optionId,
            label: labelById.get(optionId) ?? null,
          })),
          learnerAnswer,
          learnerAnswerLabels: this.answerLabels(learnerAnswer, labelById),
          correct: graded?.correct ?? null,
          pointsEarned: graded?.pointsEarned ?? null,
          pointsPossible: graded?.pointsPossible ?? null,
          correctAnswerSummary: graded?.correctAnswerSummary ?? null,
          explanation: graded?.explanation ?? null,
        };
      }),
    };
  }

  private async requireTenantUser(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Learner not found');
  }

  private mapExamAttemptSummary(attempt: {
    id: string;
    attemptNum: number;
    status: string;
    score: { toString(): string } | null;
    startedAt: Date;
    submittedAt: Date | null;
    gradedAt: Date | null;
    assessment: {
      slug: string;
      title: string;
      courseVersion: { course: { slug: string; title: string } } | null;
    };
    enrollment: {
      courseVersion: { course: { slug: string; title: string } };
    };
  }) {
    const course =
      attempt.assessment.courseVersion?.course ?? attempt.enrollment.courseVersion.course;

    return {
      id: attempt.id,
      attemptNum: attempt.attemptNum,
      status: attempt.status,
      score: attempt.score == null ? null : Number(attempt.score),
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      gradedAt: attempt.gradedAt?.toISOString() ?? null,
      course: { slug: course.slug, title: course.title },
      exam: { slug: attempt.assessment.slug, title: attempt.assessment.title },
    };
  }

  private parseAttemptPresentation(metadata: Prisma.JsonValue, responses: Prisma.JsonValue) {
    const meta = this.asPayloadObject(metadata);
    const presentation = this.asRecord(meta.presentation);
    const presentedQuestionIds = Array.isArray(presentation.presentedQuestionIds)
      ? presentation.presentedQuestionIds.filter((id): id is string => typeof id === 'string')
      : [];
    const optionOrdersRaw = this.asRecord(presentation.optionOrders);
    const optionOrders: Record<string, string[]> = {};
    for (const [questionId, order] of Object.entries(optionOrdersRaw)) {
      if (!Array.isArray(order)) continue;
      optionOrders[questionId] = order.filter((id): id is string => typeof id === 'string');
    }

    const gradedByQuestionId = new Map<string, GradedQuestionSnapshot>();
    if (Array.isArray(meta.gradedResults)) {
      for (const entry of meta.gradedResults) {
        const graded = this.asGradedQuestion(entry);
        if (graded) gradedByQuestionId.set(graded.questionId, graded);
      }
    }

    const responseMap = this.asResponseMap(responses);
    const questionIds = [...presentedQuestionIds];
    for (const questionId of gradedByQuestionId.keys()) {
      if (!questionIds.includes(questionId)) questionIds.push(questionId);
    }

    return { questionIds, optionOrders, gradedByQuestionId, responses: responseMap };
  }

  private asGradedQuestion(value: unknown): GradedQuestionSnapshot | null {
    const row = this.asRecord(value);
    if (typeof row.questionId !== 'string') return null;
    return {
      questionId: row.questionId,
      learnerAnswer: this.asLearnerAnswer(row.learnerAnswer),
      correct: typeof row.correct === 'boolean' ? row.correct : null,
      pointsEarned: typeof row.pointsEarned === 'number' ? row.pointsEarned : null,
      pointsPossible: typeof row.pointsPossible === 'number' ? row.pointsPossible : null,
      correctAnswerSummary:
        typeof row.correctAnswerSummary === 'string' ? row.correctAnswerSummary : null,
      explanation: typeof row.explanation === 'string' ? row.explanation : null,
    };
  }

  private asResponseMap(responses: Prisma.JsonValue): Record<string, LearnerAnswerValue> {
    const record = this.asPayloadObject(responses);
    const mapped: Record<string, LearnerAnswerValue> = {};
    for (const [questionId, value] of Object.entries(record)) {
      const answer = this.asLearnerAnswer(value);
      if (answer) mapped[questionId] = answer;
    }
    return mapped;
  }

  private asLearnerAnswer(value: unknown): LearnerAnswerValue | null {
    if (typeof value === 'string' && value.length > 0) return value;
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }
    return null;
  }

  private asQuestionOptions(value: unknown): { id: string; label: string }[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const option = this.asRecord(item);
      if (typeof option.id !== 'string' || typeof option.label !== 'string') return [];
      return [{ id: option.id, label: option.label }];
    });
  }

  private answerLabels(
    answer: LearnerAnswerValue | null,
    labelById: Map<string, string>,
  ): string[] {
    if (!answer) return [];
    const ids = Array.isArray(answer) ? answer : [answer];
    return ids.map((id) => labelById.get(id) ?? id);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private asPayloadObject(payload: Prisma.JsonValue): Record<string, unknown> {
    if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
      return { ...(payload as Record<string, unknown>) };
    }
    return {};
  }
}

type LearnerAnswerValue = string | string[];

type GradedQuestionSnapshot = {
  questionId: string;
  learnerAnswer: LearnerAnswerValue | null;
  correct: boolean | null;
  pointsEarned: number | null;
  pointsPossible: number | null;
  correctAnswerSummary: string | null;
  explanation: string | null;
};
