import { Injectable } from '@nestjs/common';
import {
  allRequiredBlocksComplete,
  isBlockDocument,
  parseBlockProgress,
} from '@calace/content-blocks';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  ContentPublishStatus,
  EnrollmentStatus,
  LessonProgressStatus,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { ParticipationService } from '../participation/participation.service';
import { PrismaService } from '../prisma/prisma.service';
import { isExamGateLessonSlug } from '../progress/progress.service';
import { CDPH_ONLINE_CEU, requiredSeatTimeMinutes } from './cdph-compliance.constants';
import { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import type { AssessmentSettings } from './assessment.types';
import { DEFAULT_FINAL_EXAM_SETTINGS } from './assessment.types';
import {
  enrollmentAttemptsExhausted,
  enrollmentRequiresReset,
  MAX_ENROLLMENT_COURSE_ATTEMPTS,
  courseRestartPath,
} from '../enrollments/enrollment-attempt.constants';

export type CompletionEligibilityResult = {
  eligible: boolean;
  reasons: string[];
  checks: {
    enrolled: boolean;
    lessonsComplete: boolean;
    interactionsComplete: boolean;
    seatTimeMet: boolean;
    activeParticipationAck: boolean;
    finalExamPassed: boolean;
    certificateAttestation: boolean;
  };
  lessonProgress: { completed: number; total: number };
  finalExam: {
    required: boolean;
    passed: boolean;
    attemptsUsed: number;
    maxAttempts: number;
    locked: boolean;
    requiresReset: boolean;
    canRestart: boolean;
    courseRestartPath: string | null;
    /** @deprecated Use requiresReset */
    requiresRepurchase: boolean;
    /** @deprecated Use courseRestartPath */
    repurchaseCheckoutPath: string | null;
    bestScore: number | null;
  };
  /** Learner-safe online CE requirements (no internal audit/application fields). */
  onlineCe: {
    deliveryMode: string;
    minutesPerCeuHour: number;
    seatTimeMinutes: number;
    requiredSeatTimeMinutes: number;
    seatTimeMet: boolean;
    interactionCount: number;
    attestationRequired: boolean;
    attestationCompleted: boolean;
    attestationText: string;
  };
};

@Injectable()
export class CompletionEligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly participation: ParticipationService,
    private readonly providerSettings: ProviderComplianceSettingsService,
  ) {}

  async evaluate(user: AuthUser, enrollmentId: string): Promise<CompletionEligibilityResult> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId: user.userId, deletedAt: null },
      include: {
        courseVersion: {
          include: {
            modules: {
              where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },
              include: {
                lessons: {
                  where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },
                },
              },
            },
            assessments: {
              where: { deletedAt: null, kind: AssessmentKind.FINAL_EXAM },
              take: 1,
              include: {
                _count: {
                  select: {
                    questions: { where: { deletedAt: null } },
                  },
                },
              },
            },
            course: true,
          },
        },
        lessonProgress: true,
      },
    });

    if (!enrollment) {
      return this.ineligible('Enrollment not found');
    }

    const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    const participationMeta = (meta.participation ?? {}) as Record<string, unknown>;
    const settings = this.parseSettings(
      enrollment.courseVersion.assessments[0]?.settings,
    );

    const tenantSettings = await this.providerSettings.getForTenant(enrollment.tenantId);
    const ceHours = Number(enrollment.courseVersion.ceHours);
    const requiredSeat = Math.ceil(
      ceHours * tenantSettings.minutesPerOnlineCeuHour,
    );
    const compliance = await this.participation.getStatusForEnrollment(
      enrollment.id,
      ceHours,
      enrollment.metadata,
    );
    const seatTimeMinutes = compliance.activeMinutes;
    const seatTimeMet = compliance.seatTimeMet;
    const interactionCount = compliance.interactionCount;

    const lessons = enrollment.courseVersion.modules.flatMap((m) => m.lessons);
    const completableLessons = lessons.filter((lesson) => !isExamGateLessonSlug(lesson.slug));
    const finalExam = enrollment.courseVersion.assessments[0];
    const examQuestionCount = finalExam?._count?.questions ?? 0;
    const hasRealLessons = completableLessons.length > 0;
    const hasRealExam = Boolean(finalExam) && examQuestionCount > 0;
    const hasCompletableContent = hasRealLessons || hasRealExam;

    if (!hasCompletableContent) {
      return this.blockedNoCompletableContent({
        enrollment,
        completedLessons: 0,
        completableLessonCount: completableLessons.length,
        seatTimeMinutes,
        requiredSeat,
        seatTimeMet,
        interactionCount,
        certificateAttestation: Boolean(meta.certificateAttestationAt),
        attestationText: tenantSettings.attestationText,
      });
    }

    const progressByLesson = new Map(
      enrollment.lessonProgress.map((p) => [p.lessonId, p]),
    );

    let interactionsComplete = true;
    let completedLessons = 0;

    for (const lesson of completableLessons) {
      const lp = progressByLesson.get(lesson.id);
      const lessonDone = lp?.status === LessonProgressStatus.COMPLETED;
      if (lessonDone) completedLessons += 1;

      if (isBlockDocument(lesson.content) && !lessonDone) {
        const blockProgress = parseBlockProgress(
          (lp?.metadata as Record<string, unknown>)?.blockProgress,
        );
        if (!allRequiredBlocksComplete(lesson.content, blockProgress)) {
          interactionsComplete = false;
        }
      }
    }

    const lessonsComplete =
      !settings.requireAllLessons ||
      (completableLessons.length > 0 && completedLessons >= completableLessons.length);

    const activeParticipationAck = !settings.activeParticipationRequired
      ? true
      : Boolean(
          meta.activeParticipationAcknowledged ??
            participationMeta.activeParticipationAcknowledged,
        );

    const certificateAttestation = Boolean(meta.certificateAttestationAt);

    const maxAttempts = finalExam?.maxAttempts ?? 3;
    const attempts = finalExam
      ? await this.prisma.assessmentAttempt.findMany({
          where: {
            enrollmentId,
            assessmentId: finalExam.id,
            status: {
              in: [
                AssessmentAttemptStatus.PASSED,
                AssessmentAttemptStatus.FAILED,
                AssessmentAttemptStatus.GRADED,
                AssessmentAttemptStatus.SUBMITTED,
              ],
            },
          },
        })
      : [];

    const passedAttempt = attempts.find(
      (a) => a.status === AssessmentAttemptStatus.PASSED,
    );
    const failedCount = attempts.filter(
      (a) => a.status === AssessmentAttemptStatus.FAILED,
    ).length;
    const enrollmentAttemptsUsed = enrollment.attemptsUsed;
    const requiresReset =
      enrollmentRequiresReset(enrollment.status) ||
      (!passedAttempt && enrollmentAttemptsExhausted(enrollmentAttemptsUsed));
    const locked =
      requiresReset || (!passedAttempt && failedCount >= maxAttempts);
    const bestScore = attempts.reduce<number | null>((best, a) => {
      const s = a.score ? Number(a.score) : null;
      if (s === null) return best;
      return best === null ? s : Math.max(best, s);
    }, null);

    const finalExamPassed = Boolean(passedAttempt);
    const finalExamRequired = Boolean(finalExam);

    const checks = {
      enrolled: true,
      lessonsComplete,
      interactionsComplete,
      seatTimeMet,
      activeParticipationAck,
      finalExamPassed: !finalExamRequired || finalExamPassed,
      certificateAttestation,
    };

    const reasons: string[] = [];
    if (!lessonsComplete) reasons.push('Complete all course lessons.');
    if (!interactionsComplete) {
      reasons.push(
        'Complete required interactive lesson content (CDPH interactive participation).',
      );
    }
    if (!seatTimeMet) {
      reasons.push(
        `Active participation time: ${seatTimeMinutes} of ${requiredSeat} minutes required (${CDPH_ONLINE_CEU.minutesPerCeuHour} min per CEU hour).`,
      );
    }
    if (!activeParticipationAck) {
      reasons.push('Acknowledge online active participation requirements.');
    }
    if (finalExamRequired && !finalExamPassed) {
      if (requiresReset) {
        reasons.push(
          `Exam locked after ${MAX_ENROLLMENT_COURSE_ATTEMPTS} attempts. Restart this course from the beginning or choose another course.`,
        );
      } else if (locked) {
        reasons.push(
          `Final exam locked after ${maxAttempts} failed attempts. Contact provider support for remediation.`,
        );
      } else {
        reasons.push('Pass the final course exam (CDPH material evaluation).');
      }
    }
    if (
      checks.finalExamPassed &&
      checks.lessonsComplete &&
      checks.seatTimeMet &&
      !certificateAttestation
    ) {
      reasons.push('Complete learner attestation before certificate release.');
    }

    const eligible =
      checks.enrolled &&
      checks.lessonsComplete &&
      checks.interactionsComplete &&
      checks.seatTimeMet &&
      interactionCount > 0 &&
      checks.activeParticipationAck &&
      checks.finalExamPassed &&
      checks.certificateAttestation;

    return {
      eligible,
      reasons,
      checks,
      lessonProgress: { completed: completedLessons, total: completableLessons.length },
      finalExam: {
        required: finalExamRequired,
        passed: finalExamPassed,
        attemptsUsed: enrollmentAttemptsUsed,
        maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
        locked,
        requiresReset,
        canRestart: requiresReset,
        courseRestartPath: requiresReset
          ? courseRestartPath(enrollment.courseVersion.course.slug)
          : null,
        requiresRepurchase: requiresReset,
        repurchaseCheckoutPath: requiresReset
          ? courseRestartPath(enrollment.courseVersion.course.slug)
          : null,
        bestScore,
      },
      onlineCe: {
        deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
        minutesPerCeuHour: tenantSettings.minutesPerOnlineCeuHour,
        seatTimeMinutes,
        requiredSeatTimeMinutes: requiredSeat,
        seatTimeMet,
        interactionCount,
        attestationRequired: true,
        attestationCompleted: certificateAttestation,
        attestationText: tenantSettings.attestationText,
      },
    };
  }

  private parseSettings(raw: unknown): AssessmentSettings {
    const s = (raw ?? {}) as Partial<AssessmentSettings>;
    return { ...DEFAULT_FINAL_EXAM_SETTINGS, ...s };
  }

  private blockedNoCompletableContent(params: {
    enrollment: {
      courseVersion: { course: { slug: string } };
      attemptsUsed: number;
      status: EnrollmentStatus;
    };
    completedLessons: number;
    completableLessonCount: number;
    seatTimeMinutes: number;
    requiredSeat: number;
    seatTimeMet: boolean;
    interactionCount: number;
    certificateAttestation: boolean;
    attestationText: string;
  }): CompletionEligibilityResult {
    const {
      enrollment,
      completedLessons,
      completableLessonCount,
      seatTimeMinutes,
      requiredSeat,
      seatTimeMet,
      interactionCount,
      certificateAttestation,
      attestationText,
    } = params;

    return {
      eligible: false,
      reasons: ['This course has no completable content and cannot be completed.'],
      checks: {
        enrolled: true,
        lessonsComplete: false,
        interactionsComplete: true,
        seatTimeMet,
        activeParticipationAck: true,
        finalExamPassed: false,
        certificateAttestation,
      },
      lessonProgress: { completed: completedLessons, total: completableLessonCount },
      finalExam: {
        required: false,
        passed: false,
        attemptsUsed: enrollment.attemptsUsed,
        maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
        locked: false,
        requiresReset: false,
        canRestart: false,
        courseRestartPath: null,
        requiresRepurchase: false,
        repurchaseCheckoutPath: null,
        bestScore: null,
      },
      onlineCe: {
        deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
        minutesPerCeuHour: CDPH_ONLINE_CEU.minutesPerCeuHour,
        seatTimeMinutes,
        requiredSeatTimeMinutes: requiredSeat,
        seatTimeMet,
        interactionCount,
        attestationRequired: true,
        attestationCompleted: certificateAttestation,
        attestationText,
      },
    };
  }

  private ineligible(reason: string): CompletionEligibilityResult {
    return {
      eligible: false,
      reasons: [reason],
      checks: {
        enrolled: false,
        lessonsComplete: false,
        interactionsComplete: false,
        seatTimeMet: false,
        activeParticipationAck: false,
        finalExamPassed: false,
        certificateAttestation: false,
      },
      lessonProgress: { completed: 0, total: 0 },
      finalExam: {
        required: true,
        passed: false,
        attemptsUsed: 0,
        maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
        locked: false,
        requiresReset: false,
        canRestart: false,
        courseRestartPath: null,
        requiresRepurchase: false,
        repurchaseCheckoutPath: null,
        bestScore: null,
      },
      onlineCe: {
        deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
        minutesPerCeuHour: CDPH_ONLINE_CEU.minutesPerCeuHour,
        seatTimeMinutes: 0,
        requiredSeatTimeMinutes: 0,
        seatTimeMet: false,
        interactionCount: 0,
        attestationRequired: true,
        attestationCompleted: false,
        attestationText: CDPH_ONLINE_CEU.attestationText,
      },
    };
  }
}
