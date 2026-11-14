import { Injectable } from '@nestjs/common';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  AuditAction,
  CertificateStatus,
  CompletionStatus,
  EnrollmentStatus,
} from '@calace/db';

import { rankCityAggregates } from '../account/learner-city-consent';
import { requiredActiveParticipationMinutes } from '../config/ceu-defaults';
import { PrismaService } from '../prisma/prisma.service';
import { AdminBaseService } from './admin-base.service';
import {
  bucketByWeek,
  enrollmentProgressPct,
  lastNWeekKeys,
  parseParticipationLedger,
  pct,
} from './admin-analytics.utils';

const ENROLLMENT_SCAN_LIMIT = 800;
const ATTEMPT_SCAN_LIMIT = 300;
const TIMELINE_LIMIT = 40;
/** Hide a city unless at least this many consenting learners share it. */
const CITY_AGGREGATE_MIN_COUNT = 5;

@Injectable()
export class AdminAnalyticsService extends AdminBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getAnalytics() {
    const tenantId = await this.getTenantId();
    const now = new Date();
    const days7 = new Date(now.getTime() - 7 * 86400000);
    const days30 = new Date(now.getTime() - 30 * 86400000);
    const trendWeeks = lastNWeekKeys(8);

    const learnerWhere = this.learnerUserWhere(tenantId);

    const [
      totalLearners,
      activeLearners7d,
      activeLearners30d,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      issuedCertificates,
      ceHoursAgg,
      examGroup,
      enrollmentsLedger,
      courses,
      recentLearners,
      examAttempts,
      auditRows,
      enrollmentDates,
      completionDates,
      certIssueDates,
    ] = await Promise.all([
      this.prisma.user.count({ where: learnerWhere }),
      this.prisma.user.count({
        where: { ...learnerWhere, lastLoginAt: { gte: days7 } },
      }),
      this.prisma.user.count({
        where: { ...learnerWhere, lastLoginAt: { gte: days30 } },
      }),
      this.prisma.enrollment.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.enrollment.count({
        where: { tenantId, deletedAt: null, status: EnrollmentStatus.ACTIVE },
      }),
      this.prisma.enrollment.count({
        where: { tenantId, deletedAt: null, status: EnrollmentStatus.COMPLETED },
      }),
      this.prisma.certificate.count({
        where: { user: { tenantId }, status: CertificateStatus.ISSUED },
      }),
      this.prisma.completion.aggregate({
        where: {
          user: { tenantId },
          status: CompletionStatus.APPROVED,
          certificate: { status: CertificateStatus.ISSUED },
        },
        _sum: { ceHoursEarned: true },
      }),
      this.prisma.assessmentAttempt.groupBy({
        by: ['status'],
        where: {
          enrollment: { tenantId },
          assessment: { kind: AssessmentKind.FINAL_EXAM },
          status: {
            in: [
              AssessmentAttemptStatus.PASSED,
              AssessmentAttemptStatus.FAILED,
              AssessmentAttemptStatus.GRADED,
            ],
          },
        },
        _count: { id: true },
      }),
      this.prisma.enrollment.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
        },
        select: {
          id: true,
          userId: true,
          status: true,
          enrolledAt: true,
          metadata: true,
          courseVersion: {
            select: {
              ceHours: true,
              course: { select: { id: true, slug: true, title: true } },
            },
          },
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              lastLoginAt: true,
            },
          },
        },
        take: ENROLLMENT_SCAN_LIMIT,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.course.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          id: true,
          slug: true,
          title: true,
          ceHours: true,
          versions: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: learnerWhere,
        orderBy: { lastLoginAt: 'desc' },
        take: 12,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: {
          enrollment: { tenantId },
          assessment: { kind: AssessmentKind.FINAL_EXAM },
          submittedAt: { not: null },
        },
        select: {
          id: true,
          userId: true,
          enrollmentId: true,
          status: true,
          score: true,
          submittedAt: true,
          metadata: true,
          enrollment: {
            select: {
              courseVersion: {
                select: { course: { select: { title: true, slug: true } } },
              },
            },
          },
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        take: ATTEMPT_SCAN_LIMIT,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: TIMELINE_LIMIT,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: { select: { email: true } },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { tenantId, deletedAt: null, enrolledAt: { gte: days30 } },
        select: { enrolledAt: true },
      }),
      this.prisma.completion.findMany({
        where: {
          user: { tenantId },
          status: CompletionStatus.APPROVED,
          completedAt: { gte: days30 },
        },
        select: { completedAt: true },
      }),
      this.prisma.certificate.findMany({
        where: {
          user: { tenantId },
          status: CertificateStatus.ISSUED,
          issuedAt: { gte: days30 },
        },
        select: { issuedAt: true, payload: true },
      }),
    ]);

    const examPassed =
      examGroup.find((r) => r.status === AssessmentAttemptStatus.PASSED)?._count.id ?? 0;
    const examFailed =
      examGroup.find((r) => r.status === AssessmentAttemptStatus.FAILED)?._count.id ?? 0;
    const examGraded =
      examGroup.find((r) => r.status === AssessmentAttemptStatus.GRADED)?._count.id ?? 0;
    const examDenom = examPassed + examFailed + examGraded;

    const scores = examAttempts
      .map((a) => (a.score !== null ? Number(a.score) : null))
      .filter((s): s is number => s !== null);
    const averageExamScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null;

    let seatTimeMet = 0;
    let seatTimeTracked = 0;
    let withInteractions = 0;
    let totalActiveMinutes = 0;
    let totalInteractions = 0;
    const courseAgg = new Map<
      string,
      {
        courseId: string;
        slug: string;
        title: string;
        ceHours: number;
        enrollments: number;
        completions: number;
        progressSum: number;
        activeMinutesSum: number;
        activeMinutesCount: number;
        interactionSum: number;
        examScores: number[];
        examPassed: number;
        examFailed: number;
      }
    >();

    for (const course of courses) {
      courseAgg.set(course.id, {
        courseId: course.id,
        slug: course.slug,
        title: course.title,
        ceHours: Number(course.ceHours),
        enrollments: 0,
        completions: 0,
        progressSum: 0,
        activeMinutesSum: 0,
        activeMinutesCount: 0,
        interactionSum: 0,
        examScores: [],
        examPassed: 0,
        examFailed: 0,
      });
    }

    for (const enr of enrollmentsLedger) {
      const courseId = enr.courseVersion.course.id;
      if (!courseAgg.has(courseId)) {
        courseAgg.set(courseId, {
          courseId,
          slug: enr.courseVersion.course.slug,
          title: enr.courseVersion.course.title,
          ceHours: Number(enr.courseVersion.ceHours),
          enrollments: 0,
          completions: 0,
          progressSum: 0,
          activeMinutesSum: 0,
          activeMinutesCount: 0,
          interactionSum: 0,
          examScores: [],
          examPassed: 0,
          examFailed: 0,
        });
      }

      const row = courseAgg.get(courseId)!;
      row.enrollments += 1;
      if (enr.status === EnrollmentStatus.COMPLETED) row.completions += 1;
      row.progressSum += enrollmentProgressPct(enr.metadata);

      const ledger = parseParticipationLedger(enr.metadata);
      if (ledger) {
        seatTimeTracked += 1;
        const minutes = Math.floor((ledger.activeSeconds ?? 0) / 60);
        totalActiveMinutes += minutes;
        row.activeMinutesSum += minutes;
        row.activeMinutesCount += 1;
        totalInteractions += ledger.interactionCount ?? 0;
        row.interactionSum += ledger.interactionCount ?? 0;
        if ((ledger.interactionCount ?? 0) > 0) withInteractions += 1;
        const required = requiredActiveParticipationMinutes(
          Number(enr.courseVersion.ceHours),
        );
        if (minutes >= required) seatTimeMet += 1;
      }
    }

    for (const attempt of examAttempts) {
      const title = attempt.enrollment.courseVersion.course.title;
      const course = [...courseAgg.values()].find((c) => c.title === title);
      if (!course) continue;
      if (attempt.score !== null) course.examScores.push(Number(attempt.score));
      if (attempt.status === AssessmentAttemptStatus.PASSED) course.examPassed += 1;
      if (attempt.status === AssessmentAttemptStatus.FAILED) course.examFailed += 1;
    }

    const courseIntelligence = [...courseAgg.values()]
      .map((c) => {
        const examTotal = c.examPassed + c.examFailed;
        return {
          courseId: c.courseId,
          slug: c.slug,
          title: c.title,
          ceHours: c.ceHours,
          enrollments: c.enrollments,
          completions: c.completions,
          dropOffRate: pct(c.enrollments - c.completions, c.enrollments),
          averageProgressPct:
            c.enrollments > 0 ? Math.round(c.progressSum / c.enrollments) : 0,
          averageSeatTimeMinutes:
            c.activeMinutesCount > 0
              ? Math.round(c.activeMinutesSum / c.activeMinutesCount)
              : null,
          averageExamScore:
            c.examScores.length > 0
              ? Math.round(
                  (c.examScores.reduce((a, b) => a + b, 0) / c.examScores.length) * 10,
                ) / 10
              : null,
          examPassRate: pct(c.examPassed, examTotal),
          examFailRate: pct(c.examFailed, examTotal),
          participationAnomalies: {
            placeholder: true,
            note: 'ML participation anomaly detection — future phase',
          },
        };
      })
      .sort((a, b) => b.enrollments - a.enrollments);

    const mostPopularCourses = courseIntelligence.slice(0, 5);

    const atRisk = enrollmentsLedger
      .filter((e) => {
        if (e.status === EnrollmentStatus.COMPLETED) return false;
        const progress = enrollmentProgressPct(e.metadata);
        const daysSince =
          (now.getTime() - e.enrolledAt.getTime()) / (86400000);
        return progress < 40 && daysSince >= 7;
      })
      .slice(0, 15)
      .map((e) => ({
        userId: e.userId,
        enrollmentId: e.id,
        email: e.user.email,
        name: [e.user.firstName, e.user.lastName].filter(Boolean).join(' ') || e.user.email,
        courseTitle: e.courseVersion.course.title,
        progressPct: enrollmentProgressPct(e.metadata),
        enrolledAt: e.enrolledAt.toISOString(),
      }));

    const failuresByEnrollment = new Map<string, number>();
    for (const a of examAttempts) {
      if (a.status !== AssessmentAttemptStatus.FAILED) continue;
      failuresByEnrollment.set(
        a.enrollmentId,
        (failuresByEnrollment.get(a.enrollmentId) ?? 0) + 1,
      );
    }
    const repeatedFailures = examAttempts
      .filter((a) => (failuresByEnrollment.get(a.enrollmentId) ?? 0) >= 2)
      .reduce(
        (acc, a) => {
          if (acc.some((x) => x.userId === a.userId && x.courseTitle === a.enrollment.courseVersion.course.title))
            return acc;
          acc.push({
            userId: a.userId,
            email: a.user.email,
            name: [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || a.user.email,
            courseTitle: a.enrollment.courseVersion.course.title,
            failureCount: failuresByEnrollment.get(a.enrollmentId) ?? 0,
            lastAttemptAt: a.submittedAt?.toISOString() ?? null,
          });
          return acc;
        },
        [] as {
          userId: string;
          email: string;
          name: string;
          courseTitle: string;
          failureCount: number;
          lastAttemptAt: string | null;
        }[],
      )
      .slice(0, 15);

    const missedMap = new Map<
      string,
      { questionId: string; missCount: number; courseTitles: Set<string> }
    >();
    for (const attempt of examAttempts) {
      const meta = (attempt.metadata ?? {}) as {
        gradedResults?: { questionId: string; correct: boolean }[];
      };
      const results = meta.gradedResults ?? [];
      const courseTitle = attempt.enrollment.courseVersion.course.title;
      for (const r of results) {
        if (r.correct) continue;
        const existing = missedMap.get(r.questionId) ?? {
          questionId: r.questionId,
          missCount: 0,
          courseTitles: new Set<string>(),
        };
        existing.missCount += 1;
        existing.courseTitles.add(courseTitle);
        missedMap.set(r.questionId, existing);
      }
    }

    const questionIds = [...missedMap.keys()].slice(0, 20);
    const questions =
      questionIds.length > 0
        ? await this.prisma.question.findMany({
            where: { id: { in: questionIds } },
            select: { id: true, prompt: true },
          })
        : [];
    const promptById = new Map(questions.map((q) => [q.id, q.prompt]));

    const mostMissedQuestions = [...missedMap.values()]
      .sort((a, b) => b.missCount - a.missCount)
      .slice(0, 8)
      .map((m) => ({
        questionId: m.questionId,
        prompt: (promptById.get(m.questionId) ?? 'Question').slice(0, 120),
        missCount: m.missCount,
        courses: [...m.courseTitles].slice(0, 3),
      }));

    const certByCourseRows = await this.prisma.certificate.findMany({
      where: { user: { tenantId }, status: CertificateStatus.ISSUED },
      select: {
        issuedAt: true,
        completion: {
          select: {
            ceHoursEarned: true,
            courseVersion: {
              select: { course: { select: { id: true, title: true } } },
            },
          },
        },
      },
      take: 500,
    });

    const certCourseMap = new Map<
      string,
      { courseTitle: string; count: number; ceHours: number }
    >();
    const ceHourBuckets = new Map<number, number>();
    for (const c of certByCourseRows) {
      const title = c.completion.courseVersion.course.title;
      const hours = Number(c.completion.ceHoursEarned);
      const existing = certCourseMap.get(title) ?? { courseTitle: title, count: 0, ceHours: 0 };
      existing.count += 1;
      existing.ceHours += hours;
      certCourseMap.set(title, existing);
      ceHourBuckets.set(hours, (ceHourBuckets.get(hours) ?? 0) + 1);
    }

    const examUnlockByWeek = bucketByWeek(
      examAttempts
        .filter((a) => a.status === AssessmentAttemptStatus.PASSED)
        .map((a) => a.submittedAt!)
        .filter(Boolean),
      trendWeeks,
    );

    const cityRanking = await this.prisma.learnerProfile.groupBy({
      by: ['city'],
      where: {
        city: { not: null },
        cityConsentGiven: true,
        tenantId,
      },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
    });

    const topCities = rankCityAggregates(
      cityRanking.map((r) => ({ city: r.city, count: r._count.city })),
      10,
      CITY_AGGREGATE_MIN_COUNT,
    );

    return {
      generatedAt: now.toISOString(),
      overview: {
        totalLearners,
        activeLearners7d,
        activeLearners30d,
        totalEnrollments,
        activeEnrollments,
        completions: completedEnrollments,
        issuedCertificates,
        totalCeHoursIssued: Number(ceHoursAgg._sum.ceHoursEarned ?? 0),
        averageExamPassRate: pct(examPassed, examDenom),
        averageExamScore,
        seatTimeCompletionRate: pct(seatTimeMet, seatTimeTracked),
        activeParticipationRate: pct(withInteractions, seatTimeTracked),
        courseCompletionRate: pct(completedEnrollments, totalEnrollments),
        learnerRetentionRate: null,
        learnerRetentionNote:
          'Cohort retention analytics placeholder — connect renewal-period snapshots in a future phase.',
        scannedEnrollments: enrollmentsLedger.length,
        enrollmentScanCapped: enrollmentsLedger.length >= ENROLLMENT_SCAN_LIMIT,
      },
      trends: {
        enrollments: bucketByWeek(
          enrollmentDates.map((e) => e.enrolledAt),
          trendWeeks,
        ),
        completions: bucketByWeek(
          completionDates.map((c) => c.completedAt),
          trendWeeks,
        ),
        certificates: bucketByWeek(
          certIssueDates.map((c) => c.issuedAt!).filter(Boolean),
          trendWeeks,
        ),
        examPasses: examUnlockByWeek,
      },
      courses: {
        items: courseIntelligence,
        mostPopular: mostPopularCourses,
        mostMissedQuestions,
      },
      learners: {
        recentlyActive: recentLearners.map((u) => ({
          id: u.id,
          email: u.email,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        })),
        atRisk,
        repeatedFailures,
        suspiciousParticipation: {
          placeholder: true,
          items: [],
          note: 'Pattern-based fraud / idle-tab detection — future ML phase',
        },
        incompleteAttestation: {
          placeholder: true,
          count: enrollmentsLedger.filter((e) => {
            const meta = (e.metadata ?? {}) as Record<string, unknown>;
            return (
              e.status === EnrollmentStatus.ACTIVE &&
              !meta.certificateAttestationAt &&
              enrollmentProgressPct(e.metadata) >= 80
            );
          }).length,
          note: 'Learners near completion without certificate attestation',
        },
      },
      participation: {
        enrollmentsWithLedger: seatTimeTracked,
        averageActiveMinutes:
          seatTimeTracked > 0 ? Math.round(totalActiveMinutes / seatTimeTracked) : null,
        averageInteractionCount:
          seatTimeTracked > 0
            ? Math.round((totalInteractions / seatTimeTracked) * 10) / 10
            : null,
        seatTimeComplianceRate: pct(seatTimeMet, seatTimeTracked),
        activeVsIdleNote:
          'Idle time is not separately stored; heartbeats credit active participation only.',
        averageCompletionDays: null,
        averageCompletionDaysNote:
          'Enrollment-to-completion duration aggregates — enable when completion volume supports stable averages.',
        examUnlockTrend: examUnlockByWeek,
      },
      certificates: {
        issuedTotal: issuedCertificates,
        totalCeHoursIssued: Number(ceHoursAgg._sum.ceHoursEarned ?? 0),
        byCourse: [...certCourseMap.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, 12),
        onlineCeDistribution: [...ceHourBuckets.entries()]
          .map(([hours, count]) => ({ hours, count }))
          .sort((a, b) => a.hours - b.hours),
        verificationUsage: {
          placeholder: true,
          verifyEvents: 0,
          note: 'Public verification endpoint analytics — future phase',
        },
      },
      activityTimeline: auditRows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId?.slice(0, 10) ?? '—',
        actorEmail: row.actor?.email ?? 'system',
        createdAt: row.createdAt.toISOString(),
        category:
          row.action === AuditAction.LOGIN
            ? 'login'
            : row.entityType === 'assessment_attempt'
              ? 'exam'
              : row.entityType === 'certificate'
                ? 'certificate'
                : row.entityType,
      })),
      placeholders: {
        aiPredictions: 'Completion risk scoring — not enabled',
        mlAnomalyDetection: 'Participation anomaly models — not enabled',
        cohortRetention: 'Renewal cohort charts — use compliance snapshots later',
      },
      topCities,
    };
  }
}
