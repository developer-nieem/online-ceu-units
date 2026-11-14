import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  AuditAction,
  CourseStatus,
  CourseVersionStatus,
  CompletionStatus,
  EnrollmentStatus,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';
import { CredentialsOrchestratorService } from '../credentials/credentials-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentScoringService } from './assessment-scoring.service';
import type {
  AssessmentSettings,
  AttemptPresentation,
  LearnerAnswerValue,
  PresentedQuestion,
  QuestionOption,
} from './assessment.types';
import {
  CDPH_ONLINE_CEU,
  CNA_LICENSE_REQUIRED_FOR_CERTIFICATE,
  hasUsableCnaLicenseNumber,
} from './cdph-compliance.constants';
import { DEFAULT_FINAL_EXAM_SETTINGS } from './assessment.types';
import { CompletionEligibilityService } from './completion-eligibility.service';
import { MilestoneBadgeService } from './milestone-badge.service';
import { ParticipationService } from '../participation/participation.service';
import {
  enrollmentAttemptsExhausted,
  MAX_ENROLLMENT_COURSE_ATTEMPTS,
  courseRestartPath,
} from '../enrollments/enrollment-attempt.constants';
import {
  assertEnrollmentAttemptsAvailable,
  incrementEnrollmentAttemptUsage,
} from '../enrollments/enrollment-attempt.util';
import {
  mapPresentedOptions,
  randomizeExamQuestions,
} from './exam-randomization.util';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: AssessmentScoringService,
    private readonly eligibility: CompletionEligibilityService,
    private readonly participation: ParticipationService,
    private readonly audit: AuditService,
    private readonly credentials: CredentialsOrchestratorService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly milestoneBadges: MilestoneBadgeService,
  ) {}

  async getCompletionEligibility(user: AuthUser, courseSlug: string) {
    const enrollment = await this.getEnrollment(user, courseSlug);
    return this.eligibility.evaluate(user, enrollment.id);
  }

  async getFinalExamOverview(user: AuthUser, courseSlug: string) {
    const enrollment = await this.getEnrollment(user, courseSlug);
    const assessment = await this.getFinalExamAssessment(enrollment.courseVersionId);
    const settings = this.parseSettings(assessment.settings);
    const eligibility = await this.eligibility.evaluate(user, enrollment.id);

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { enrollmentId: enrollment.id, assessmentId: assessment.id },
      orderBy: { attemptNum: 'desc' },
    });

    const questionBankSize = await this.prisma.question.count({
      where: { assessmentId: assessment.id, deletedAt: null },
    });

    const inProgressAttempt = attempts.find(
      (a) =>
        a.status === AssessmentAttemptStatus.IN_PROGRESS && a.userId === user.userId,
    );

    return {
      assessment: {
        id: assessment.id,
        slug: assessment.slug,
        title: assessment.title,
        kind: assessment.kind,
        passingScore: Number(assessment.passingScore ?? 80),
        maxAttempts: assessment.maxAttempts ?? 3,
        questionBankSize,
        questionsPerAttempt: Math.min(settings.questionCount, questionBankSize),
      },
      eligibility,
      attempts: attempts.map((a) => ({
        id: a.id,
        attemptNum: a.attemptNum,
        status: a.status,
        score: a.score ? Number(a.score) : null,
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt?.toISOString() ?? null,
        passed: a.status === AssessmentAttemptStatus.PASSED,
      })),
      participation: await this.participation.getComplianceStatus(user, courseSlug),
      canStartAttempt: this.canStartAttempt(eligibility, attempts, assessment.maxAttempts ?? 3),
      canResumeAttempt: this.canResumeAttempt(eligibility, attempts, user.userId),
      inProgressAttemptId: inProgressAttempt?.id ?? null,
    };
  }

  async startFinalExamAttempt(user: AuthUser, courseSlug: string) {
    const enrollment = await this.getEnrollment(user, courseSlug);
    const assessment = await this.getFinalExamAssessment(enrollment.courseVersionId);
    const settings = this.parseSettings(assessment.settings);
    const eligibility = await this.eligibility.evaluate(user, enrollment.id);

    const priorAttempts = await this.prisma.assessmentAttempt.findMany({
      where: { enrollmentId: enrollment.id, assessmentId: assessment.id },
    });

    if (priorAttempts.some((a) => a.status === AssessmentAttemptStatus.PASSED)) {
      throw new BadRequestException('Final exam already passed');
    }

    this.guardEnrollmentAttempts(enrollment, courseSlug);

    const maxAttempts = assessment.maxAttempts ?? 3;
    const completedAttempts = priorAttempts.filter(
      (a) =>
        a.status === AssessmentAttemptStatus.FAILED ||
        a.status === AssessmentAttemptStatus.PASSED ||
        a.status === AssessmentAttemptStatus.GRADED ||
        a.status === AssessmentAttemptStatus.SUBMITTED,
    );

    if (
      completedAttempts.length >= maxAttempts ||
      enrollmentAttemptsExhausted(enrollment.attemptsUsed)
    ) {
      throw this.requiresResetException(courseSlug);
    }

    const openAttempts = priorAttempts.filter(
      (a) => a.status === AssessmentAttemptStatus.IN_PROGRESS,
    );
    if (openAttempts.length > 0) {
      const resumable = openAttempts
        .filter((a) => a.userId === user.userId)
        .sort((a, b) => b.attemptNum - a.attemptNum)
        .find((a) => this.getAttemptPresentation(a.metadata));
      if (resumable) {
        return this.serializeInProgressAttempt(
          resumable,
          Number(assessment.passingScore ?? 80),
        );
      }
      throw new BadRequestException('You already have an exam attempt in progress');
    }

    if (!eligibility.checks.lessonsComplete || !eligibility.checks.interactionsComplete) {
      throw new BadRequestException(
        'Complete all lessons and required interactions before starting the final exam.',
      );
    }

    if (
      settings.activeParticipationRequired &&
      !eligibility.checks.activeParticipationAck
    ) {
      throw new BadRequestException(
        'Acknowledge active participation before starting the final exam.',
      );
    }

    if (!eligibility.checks.seatTimeMet) {
      throw new BadRequestException(
        `Active participation time not met (${eligibility.onlineCe.seatTimeMinutes} of ${eligibility.onlineCe.requiredSeatTimeMinutes} minutes). Continue learning with the course player open and engaged.`,
      );
    }

    if (eligibility.onlineCe.interactionCount < 1) {
      throw new BadRequestException(
        'Complete interactive lesson activities before starting the final exam.',
      );
    }

    const bank = await this.prisma.question.findMany({
      where: { assessmentId: assessment.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    if (bank.length === 0) {
      throw new NotFoundException('Final exam question bank is empty');
    }

    const count = Math.min(settings.questionCount, bank.length);
    const { selected, optionOrders } = randomizeExamQuestions(bank, count, {
      randomizeQuestions: settings.randomizeQuestions,
      randomizeOptions: settings.randomizeOptions,
    });

    const presentation: AttemptPresentation = {
      presentedQuestionIds: selected.map((q) => q.id),
      optionOrders,
    };

    const presentedQuestions = this.buildPresentedQuestions(selected, presentation);

    const attemptNum = priorAttempts.length + 1;
    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        enrollmentId: enrollment.id,
        assessmentId: assessment.id,
        userId: user.userId,
        attemptNum,
        status: AssessmentAttemptStatus.IN_PROGRESS,
        metadata: { presentation },
        responses: {},
      },
    });

    await this.audit.log({
      tenantId: enrollment.tenantId,
      actorId: user.userId,
      action: AuditAction.CREATE,
      entityType: 'assessment_attempt',
      entityId: attempt.id,
      metadata: { courseSlug, assessmentId: assessment.id, attemptNum },
    });

    return {
      attemptId: attempt.id,
      attemptNum,
      passingScore: Number(assessment.passingScore ?? 80),
      questions: presentedQuestions,
      questionCount: presentedQuestions.length,
    };
  }

  async resumeFinalExamAttempt(user: AuthUser, courseSlug: string) {
    const enrollment = await this.getEnrollment(user, courseSlug);
    const assessment = await this.getFinalExamAssessment(enrollment.courseVersionId);

    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        enrollmentId: enrollment.id,
        assessmentId: assessment.id,
        userId: user.userId,
        status: AssessmentAttemptStatus.IN_PROGRESS,
      },
      orderBy: { attemptNum: 'desc' },
    });

    if (!attempt) {
      throw new NotFoundException('No exam attempt in progress');
    }

    if (!this.getAttemptPresentation(attempt.metadata)) {
      throw new BadRequestException('Invalid attempt presentation');
    }

    return this.serializeInProgressAttempt(
      attempt,
      Number(assessment.passingScore ?? 80),
    );
  }

  async saveAttemptAnswers(
    user: AuthUser,
    attemptId: string,
    answers: Record<string, LearnerAnswerValue>,
  ) {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, userId: user.userId },
      select: { id: true, status: true },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== AssessmentAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt already submitted');
    }

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { responses: answers },
    });

    return { ok: true };
  }

  async submitAttempt(
    user: AuthUser,
    attemptId: string,
    answers: Record<string, LearnerAnswerValue>,
  ) {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, userId: user.userId },
      include: {
        assessment: true,
        enrollment: { include: { courseVersion: { include: { course: true } } } },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== AssessmentAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt already submitted');
    }

    const presentation = (attempt.metadata as { presentation?: AttemptPresentation })
      .presentation;
    if (!presentation?.presentedQuestionIds?.length) {
      throw new BadRequestException('Invalid attempt presentation');
    }

    const questions = await this.prisma.question.findMany({
      where: { id: { in: presentation.presentedQuestionIds } },
    });

    const orderedQuestions = presentation.presentedQuestionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is (typeof questions)[0] => Boolean(q));

    const graded = this.scoring.gradeAttempt(orderedQuestions, answers);
    const passingScore = Number(attempt.assessment.passingScore ?? 80);
    const passFail = this.scoring.finalizePassFail(graded.scorePct, passingScore);
    graded.passed = passFail.passed;
    graded.passingScore = passFail.passingScore;

    const now = new Date();
    const status = passFail.passed
      ? AssessmentAttemptStatus.PASSED
      : AssessmentAttemptStatus.FAILED;

    const updated = await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status,
        score: passFail.scorePct,
        responses: answers,
        submittedAt: now,
        gradedAt: now,
        metadata: {
          ...(attempt.metadata as object),
          gradedResults: graded.results,
        },
      },
    });

    await this.participation.recordInteractionEvidence(
      attempt.enrollmentId,
      'quiz_activity',
      undefined,
      { attemptId, passed: passFail.passed },
    );

    let attemptUsage: { attemptsUsed: number; requiresReset: boolean } | null = null;
    if (attempt.assessment.kind === AssessmentKind.FINAL_EXAM) {
      attemptUsage = await incrementEnrollmentAttemptUsage(
        this.prisma,
        attempt.enrollmentId,
        attempt.enrollment.courseVersion.course.slug,
        passFail.passed,
      );
    }

    await this.audit.log({
      tenantId: attempt.enrollment.tenantId,
      actorId: user.userId,
      action: AuditAction.UPDATE,
      entityType: 'assessment_attempt',
      entityId: attempt.id,
      after: { score: passFail.scorePct, passed: passFail.passed },
    });

    if (attempt.assessment.kind === AssessmentKind.FINAL_EXAM) {
      const course = attempt.enrollment.courseVersion.course;
      void this.notifications
        .notifyFinalExamResult(
          attempt.enrollment.tenantId,
          user.userId,
          course.title,
          course.slug,
          passFail.passed,
          attempt.id,
        )
        .catch(() => undefined);

      const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
      const courseUrl = `${webUrl.replace(/\/$/, '')}/courses/${course.slug}`;
      void this.notifications
        .sendFinalExamResultEmail({
          tenantId: attempt.enrollment.tenantId,
          userId: user.userId,
          to: user.email,
          firstName: user.firstName ?? undefined,
          courseTitle: course.title,
          passed: passFail.passed,
          scorePct: passFail.scorePct,
          courseUrl,
        })
        .catch(() => undefined);
    }

    const postPassEligibility = passFail.passed
      ? await this.eligibility.evaluate(user, attempt.enrollmentId)
      : null;

    return {
      attemptId: updated.id,
      status: updated.status,
      score: passFail.scorePct,
      passingScore: passFail.passingScore,
      passed: passFail.passed,
      results: graded.results,
      remediationMessage: passFail.passed
        ? null
        : attemptUsage?.requiresReset
          ? 'Exam locked after 3 attempts. Restart this course from the beginning or choose another course.'
          : 'Review the rationales below and retry when ready. You must pass the final exam to receive your certificate.',
      requiresCertificateAttestation: Boolean(
        passFail.passed && !postPassEligibility?.checks.certificateAttestation,
      ),
      attestationText: passFail.passed ? CDPH_ONLINE_CEU.attestationText : null,
      requiresReset: attemptUsage?.requiresReset ?? false,
      canRestart: attemptUsage?.requiresReset ?? false,
      attemptsUsed: attemptUsage?.attemptsUsed,
      maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
      courseRestartPath: attemptUsage?.requiresReset
        ? courseRestartPath(attempt.enrollment.courseVersion.course.slug)
        : undefined,
      /** @deprecated Use requiresReset */
      requiresRepurchase: attemptUsage?.requiresReset ?? false,
      /** @deprecated Use courseRestartPath */
      repurchaseCheckoutPath: attemptUsage?.requiresReset
        ? courseRestartPath(attempt.enrollment.courseVersion.course.slug)
        : undefined,
      nextSteps: passFail.passed
        ? {
            message: 'Congratulations — you passed the final exam.',
            certificatePlaceholder:
              'Complete the learner attestation on the exam page to release your certificate (CDPH online CE requirement). PDF download coming soon.',
            href: `/courses/${attempt.enrollment.courseVersion.course.slug}/exam`,
          }
        : attemptUsage?.requiresReset
          ? {
              message: 'Exam locked after 3 attempts.',
              certificatePlaceholder: null,
              href: courseRestartPath(attempt.enrollment.courseVersion.course.slug),
            }
          : null,
    };
  }

  async acknowledgeActiveParticipation(user: AuthUser, courseSlug: string) {
    const enrollment = await this.getEnrollment(user, courseSlug);
    const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    const participation = (meta.participation ?? {}) as Record<string, unknown>;
    const now = new Date().toISOString();
    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        metadata: {
          ...meta,
          activeParticipationAcknowledged: true,
          activeParticipationAcknowledgedAt: now,
          participation: {
            ...participation,
            activeParticipationAcknowledged: true,
            activeParticipationAcknowledgedAt: now,
          },
        },
      },
    });

    await this.audit.log({
      tenantId: enrollment.tenantId,
      actorId: user.userId,
      action: AuditAction.UPDATE,
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: { courseSlug, cdph: 'active_participation_ack' },
    });

    return { success: true };
  }

  async attestCertificateRelease(user: AuthUser, courseSlug: string, confirmed: boolean) {
    if (!confirmed) {
      throw new BadRequestException('Attestation confirmation is required');
    }

    const enrollment = await this.getEnrollment(user, courseSlug);
    await this.assertCnaLicenseOnFile(user.userId);
    const check = await this.eligibility.evaluate(user, enrollment.id);

    if (!check.checks.finalExamPassed) {
      throw new BadRequestException('Pass the final exam before attesting for certificate release.');
    }

    if (!check.checks.seatTimeMet) {
      const remaining = Math.max(
        0,
        check.onlineCe.requiredSeatTimeMinutes - check.onlineCe.seatTimeMinutes,
      );
      throw new BadRequestException(
        `Active participation time not met (${check.onlineCe.seatTimeMinutes} of ${check.onlineCe.requiredSeatTimeMinutes} minutes). Spend about ${remaining} more minute${remaining === 1 ? '' : 's'} reviewing course material with this tab active before claiming your certificate.`,
      );
    }

    if (check.onlineCe.interactionCount < 1) {
      throw new BadRequestException(
        'Complete interactive lesson activities before claiming your certificate.',
      );
    }

    const preAttestationEligible =
      check.checks.enrolled &&
      check.checks.lessonsComplete &&
      check.checks.interactionsComplete &&
      check.checks.seatTimeMet &&
      check.checks.activeParticipationAck &&
      check.checks.finalExamPassed;

    if (!preAttestationEligible) {
      throw new BadRequestException(
        check.reasons.find((r) => !r.includes('attestation')) ??
          'Complete all course requirements before certificate release.',
      );
    }

    const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    const now = new Date().toISOString();
    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        metadata: {
          ...meta,
          certificateAttestationAt: now,
          certificateAttestationText: CDPH_ONLINE_CEU.attestationText,
          certificateAttestationByUserId: user.userId,
        },
      },
    });

    await this.audit.log({
      tenantId: enrollment.tenantId,
      actorId: user.userId,
      action: AuditAction.UPDATE,
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: { courseSlug, cdph: 'certificate_attestation' },
    });

    const finalized = await this.tryFinalizeCourseCompletion(user, enrollment.id);
    const eligibility = await this.eligibility.evaluate(user, enrollment.id);

    return {
      success: true,
      finalized: finalized.finalized,
      newBadgeEarned: finalized.newBadgeEarned ?? null,
      eligibility,
    };
  }

  async tryFinalizeCourseCompletion(user: AuthUser, enrollmentId: string) {
    const check = await this.eligibility.evaluate(user, enrollmentId);
    if (!check.eligible) return { finalized: false, reasons: check.reasons };

    const licenseOnFile = await this.getCnaLicenseNumber(user.userId);
    if (!hasUsableCnaLicenseNumber(licenseOnFile)) {
      return { finalized: false, reasons: [CNA_LICENSE_REQUIRED_FOR_CERTIFICATE] };
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { completions: true },
    });
    if (!enrollment) return { finalized: false, reasons: ['Enrollment not found'] };

    const now = new Date();
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.COMPLETED,
        completedAt: enrollment.completedAt ?? now,
        metadata: {
          ...(enrollment.metadata as object),
          completionFinalizedAt: now.toISOString(),
          onlineCeCompliance: {
            deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
            attestationAt:
              (enrollment.metadata as Record<string, unknown>).certificateAttestationAt ??
              null,
          },
        },
      },
    });

    if (enrollment.completions.length === 0) {
      const completion = await this.prisma.completion.create({
        data: {
          enrollmentId,
          userId: enrollment.userId,
          courseVersionId: enrollment.courseVersionId,
          status: CompletionStatus.APPROVED,
          ceHoursEarned: 0,
          completedAt: now,
          approvedAt: now,
          metadata: { source: 'final_exam_pass' },
        },
        include: { courseVersion: true },
      });
      const version = await this.prisma.courseVersion.findUnique({
        where: { id: enrollment.courseVersionId },
      });
      if (version) {
        await this.prisma.completion.update({
          where: { id: completion.id },
          data: { ceHoursEarned: version.ceHours },
        });
      }
      await this.credentials.processCompletion(completion.id, user.userId);
    } else {
      const existing = enrollment.completions[0];
      if (existing) {
        await this.credentials.processCompletion(existing.id, user.userId);
      }
    }

    const newBadgeEarned = await this.milestoneBadges.checkAndAwardMilestoneBadge(
      enrollment.userId,
      enrollment.tenantId,
    );

    return { finalized: true, reasons: [], newBadgeEarned };
  }

  private async getCnaLicenseNumber(userId: string): Promise<string | null> {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: { licenseNumber: true },
    });
    return profile?.licenseNumber?.trim() || null;
  }

  private async assertCnaLicenseOnFile(userId: string): Promise<void> {
    const license = await this.getCnaLicenseNumber(userId);
    if (!hasUsableCnaLicenseNumber(license)) {
      throw new BadRequestException(CNA_LICENSE_REQUIRED_FOR_CERTIFICATE);
    }
  }

  private guardEnrollmentAttempts(
    enrollment: { attemptsUsed: number; status: EnrollmentStatus },
    courseSlug: string,
  ) {
    try {
      assertEnrollmentAttemptsAvailable(enrollment, courseSlug);
    } catch (err) {
      const e = err as Error & { code?: string; checkoutPath?: string };
      if (e.code === 'REQUIRES_RESET' || e.code === 'REQUIRES_REPURCHASE') {
        throw this.requiresResetException(courseSlug);
      }
      throw err;
    }
  }

  private requiresResetException(courseSlug: string) {
    return new ForbiddenException({
      statusCode: 403,
      message:
        'Exam locked after 3 attempts. Restart this course from the beginning or choose another course.',
      error: 'REQUIRES_RESET',
      courseSlug,
      courseRestartPath: courseRestartPath(courseSlug),
      maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
    });
  }

  /** @deprecated Use requiresResetException */
  private requiresRepurchaseException(courseSlug: string) {
    return this.requiresResetException(courseSlug);
  }

  private buildPresentedQuestions(
    questions: Array<{
      id: string;
      type: import('@calace/db').QuestionType;
      prompt: string;
      options: unknown;
      points: unknown;
      metadata: unknown;
    }>,
    presentation: AttemptPresentation,
  ): PresentedQuestion[] {
    return presentation.presentedQuestionIds
      .map((id): PresentedQuestion | null => {
        const q = questions.find((x) => x.id === id);
        if (!q) return null;
        const options = (q.options ?? []) as QuestionOption[];
        const ordered = presentation.optionOrders[id] ?? options.map((o) => o.id);
        const meta = (q.metadata ?? {}) as { scenarioContext?: string };
        const presented: PresentedQuestion = {
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          options: mapPresentedOptions(options, ordered),
          points: Number(q.points),
          ...(meta.scenarioContext !== undefined
            ? { scenarioContext: meta.scenarioContext }
            : {}),
        };
        return presented;
      })
      .filter((q): q is PresentedQuestion => q !== null);
  }

  private getAttemptPresentation(metadata: unknown): AttemptPresentation | null {
    const presentation = (metadata as { presentation?: AttemptPresentation } | null)
      ?.presentation;
    if (!presentation?.presentedQuestionIds?.length) return null;
    return presentation;
  }

  private async serializeInProgressAttempt(
    attempt: {
      id: string;
      attemptNum: number;
      metadata: unknown;
      responses: unknown;
    },
    passingScore: number,
  ) {
    const presentation = this.getAttemptPresentation(attempt.metadata);
    if (!presentation) {
      throw new BadRequestException('Invalid attempt presentation');
    }

    const questions = await this.prisma.question.findMany({
      where: { id: { in: presentation.presentedQuestionIds } },
    });

    const presentedQuestions = this.buildPresentedQuestions(questions, presentation);
    const savedAnswers = (attempt.responses ?? {}) as Record<string, LearnerAnswerValue>;

    return {
      attemptId: attempt.id,
      attemptNum: attempt.attemptNum,
      passingScore,
      questions: presentedQuestions,
      questionCount: presentedQuestions.length,
      savedAnswers,
    };
  }

  private canResumeAttempt(
    eligibility: Awaited<ReturnType<CompletionEligibilityService['evaluate']>>,
    attempts: Array<{ status: AssessmentAttemptStatus; userId: string }>,
    userId: string,
  ) {
    if (eligibility.finalExam.passed) return false;
    if (eligibility.finalExam.locked) return false;
    if (eligibility.finalExam.requiresReset || eligibility.finalExam.requiresRepurchase) {
      return false;
    }
    return attempts.some(
      (a) => a.status === AssessmentAttemptStatus.IN_PROGRESS && a.userId === userId,
    );
  }

  private canStartAttempt(
    eligibility: Awaited<ReturnType<CompletionEligibilityService['evaluate']>>,
    attempts: Array<{ status: AssessmentAttemptStatus }>,
    maxAttempts: number,
  ) {
    if (eligibility.finalExam.passed) return false;
    if (eligibility.finalExam.locked) return false;
    if (eligibility.finalExam.requiresReset || eligibility.finalExam.requiresRepurchase) return false;
    if (!eligibility.checks.lessonsComplete) return false;
    if (!eligibility.checks.interactionsComplete) return false;
    if (!eligibility.checks.seatTimeMet) return false;
    if ((eligibility.onlineCe.interactionCount ?? 0) < 1) return false;
    if (!eligibility.checks.activeParticipationAck) return false;
    if (
      attempts.filter(
        (a) =>
          a.status === AssessmentAttemptStatus.FAILED ||
          a.status === AssessmentAttemptStatus.PASSED,
      ).length >= maxAttempts
    ) {
      return false;
    }
    if (attempts.some((a) => a.status === AssessmentAttemptStatus.IN_PROGRESS)) {
      return false;
    }
    return true;
  }

  private async getEnrollment(user: AuthUser, courseSlug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');

    const course = await this.prisma.course.findFirst({
      where: {
        tenantId: tenant.id,
        slug: courseSlug,
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        versions: {
          where: { status: CourseVersionStatus.PUBLISHED, deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    const version = course?.versions[0];
    if (!version) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: user.userId,
        courseVersionId: version.id,
        deletedAt: null,
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment required');
    return enrollment;
  }

  private async getFinalExamAssessment(courseVersionId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        courseVersionId,
        kind: AssessmentKind.FINAL_EXAM,
        deletedAt: null,
      },
    });
    if (!assessment) {
      throw new NotFoundException('Final exam not configured for this course');
    }
    return assessment;
  }

  private parseSettings(raw: unknown): AssessmentSettings {
    return { ...DEFAULT_FINAL_EXAM_SETTINGS, ...(raw as Partial<AssessmentSettings>) };
  }
}
