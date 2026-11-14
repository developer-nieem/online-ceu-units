import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  CertificateStatus,
  CompletionStatus,
  CourseVersionStatus,
  EnrollmentStatus,
} from '@calace/db';

import { requiredActiveParticipationMinutes } from '../config/ceu-defaults';
import { AdminBaseService } from './admin-base.service';
import type { ParticipationLedgerV1 } from '../participation/participation.types';

@Injectable()
export class AdminCoursesService extends AdminBaseService {
  async listCourseOperations() {
    const tenantId = await this.getTenantId();
    const courses = await this.prisma.course.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { title: 'asc' },
      include: {
        versions: {
          where: { deletedAt: null, status: CourseVersionStatus.PUBLISHED },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          select: { id: true, versionNumber: true },
        },
      },
    });

    const results = [];
    for (const course of courses) {
      const version = course.versions[0];
      if (!version) {
        results.push({
          courseId: course.id,
          slug: course.slug,
          title: course.title,
          status: course.status,
          ceHours: Number(course.ceHours),
          enrollmentCount: 0,
          completionCount: 0,
          averageProgressPct: 0,
          examPassRate: null,
          seatTimeComplianceRate: null,
        });
        continue;
      }

      const stats = await this.statsForVersion(version.id, Number(course.ceHours));
      results.push({
        courseId: course.id,
        slug: course.slug,
        title: course.title,
        status: course.status,
        ceHours: Number(course.ceHours),
        publishedVersion: version.versionNumber,
        ...stats,
      });
    }

    return results;
  }

  async getCourseOperations(courseId: string) {
    const tenantId = await this.getTenantId();
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      include: {
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const versionStats = [];
    for (const v of course.versions) {
      versionStats.push({
        versionId: v.id,
        versionNumber: v.versionNumber,
        status: v.status,
        ...(await this.statsForVersion(v.id, Number(v.ceHours))),
      });
    }

    return {
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      ceHours: Number(course.ceHours),
      versions: versionStats,
    };
  }

  private async statsForVersion(courseVersionId: string, ceHours: number) {
    const [enrollmentCount, completionCount, progressRows, examGroup, enrollments] =
      await Promise.all([
        this.prisma.enrollment.count({
          where: { courseVersionId, deletedAt: null },
        }),
        this.prisma.completion.count({
          where: {
            courseVersionId,
            status: CompletionStatus.APPROVED,
          },
        }),
        this.prisma.lessonProgress.findMany({
          where: { enrollment: { courseVersionId, deletedAt: null } },
          select: { enrollmentId: true, progressPct: true },
        }),
        this.prisma.assessmentAttempt.groupBy({
          by: ['status'],
          where: {
            enrollment: { courseVersionId },
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
            courseVersionId,
            deletedAt: null,
            status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
          },
          select: { metadata: true },
        }),
      ]);

    const byEnrollment = new Map<string, number[]>();
    for (const row of progressRows) {
      const list = byEnrollment.get(row.enrollmentId) ?? [];
      list.push(Number(row.progressPct));
      byEnrollment.set(row.enrollmentId, list);
    }
    const avgs: number[] = [];
    for (const pcts of byEnrollment.values()) {
      if (pcts.length === 0) continue;
      avgs.push(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    }
    const averageProgressPct =
      avgs.length > 0 ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;

    const passed =
      examGroup.find((g) => g.status === AssessmentAttemptStatus.PASSED)?._count.id ?? 0;
    const failed =
      examGroup.find((g) => g.status === AssessmentAttemptStatus.FAILED)?._count.id ?? 0;
    const graded =
      examGroup.find((g) => g.status === AssessmentAttemptStatus.GRADED)?._count.id ?? 0;
    const examDenom = passed + failed + graded;

    let seatMet = 0;
    let seatTracked = 0;
    const required = requiredActiveParticipationMinutes(ceHours);
    for (const e of enrollments) {
      const ledger = (e.metadata as { participationLedger?: ParticipationLedgerV1 })
        ?.participationLedger;
      if (!ledger || ledger.version !== 1) continue;
      seatTracked += 1;
      if (Math.floor((ledger.activeSeconds ?? 0) / 60) >= required) seatMet += 1;
    }

    return {
      enrollmentCount,
      completionCount,
      averageProgressPct,
      examPassRate: examDenom > 0 ? Math.round((passed / examDenom) * 100) : null,
      seatTimeComplianceRate:
        seatTracked > 0 ? Math.round((seatMet / seatTracked) * 100) : null,
      issuedCertificates: await this.prisma.certificate.count({
        where: {
          status: CertificateStatus.ISSUED,
          completion: { courseVersionId },
        },
      }),
    };
  }
}
