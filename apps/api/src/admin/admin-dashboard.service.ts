import { Injectable } from '@nestjs/common';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  CertificateStatus,
  CompletionStatus,
  EnrollmentStatus,
  OrderStatus,
  SubscriptionStatus,
  SupportTicketStatus,
} from '@calace/db';

import { requiredActiveParticipationMinutes } from '../config/ceu-defaults';
import { AdminBaseService } from './admin-base.service';
import type { ParticipationLedgerV1 } from '../participation/participation.types';
import { paidRealStripeOrderWhere } from './real-stripe-order';

@Injectable()
export class AdminDashboardService extends AdminBaseService {
  async getOverview() {
    const tenantId = await this.getTenantId();

    const [
      totalLearners,
      activeEnrollments,
      completedCourses,
      issuedCertificates,
      ceHoursAgg,
      examStats,
      enrollmentsForSeatTime,
      revenueAgg,
      subscriptionCount,
      failedOrders,
      openTickets,
    ] = await Promise.all([
      this.prisma.user.count({ where: this.learnerUserWhere(tenantId) }),
      this.prisma.enrollment.count({
        where: { tenantId, deletedAt: null, status: EnrollmentStatus.ACTIVE },
      }),
      this.prisma.completion.count({
        where: { user: { tenantId }, status: CompletionStatus.APPROVED },
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
          metadata: true,
          courseVersion: { select: { ceHours: true } },
        },
        take: 500,
      }),
      this.prisma.order.aggregate({
        where: paidRealStripeOrderWhere(tenantId),
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.subscription.count({
        where: { tenantId, status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.order.count({
        where: { tenantId, status: OrderStatus.FAILED },
      }),
      this.prisma.supportTicket.count({
        where: { tenantId, deletedAt: null, status: SupportTicketStatus.OPEN },
      }),
    ]);

    const examPassed =
      examStats.find((r) => r.status === AssessmentAttemptStatus.PASSED)?._count.id ?? 0;
    const examFailed =
      examStats.find((r) => r.status === AssessmentAttemptStatus.FAILED)?._count.id ?? 0;
    const examGraded =
      examStats.find((r) => r.status === AssessmentAttemptStatus.GRADED)?._count.id ?? 0;
    const examDenom = examPassed + examFailed + examGraded;
    const examPassRate = examDenom > 0 ? Math.round((examPassed / examDenom) * 100) : null;

    let seatTimeMet = 0;
    let seatTimeTracked = 0;
    for (const enr of enrollmentsForSeatTime) {
      const meta = (enr.metadata ?? {}) as Record<string, unknown>;
      const ledger = meta.participationLedger as ParticipationLedgerV1 | undefined;
      if (!ledger || ledger.version !== 1) continue;
      seatTimeTracked += 1;
      const required = requiredActiveParticipationMinutes(Number(enr.courseVersion.ceHours));
      const minutes = Math.floor((ledger.activeSeconds ?? 0) / 60);
      if (minutes >= required) seatTimeMet += 1;
    }
    const seatTimeComplianceRate =
      seatTimeTracked > 0 ? Math.round((seatTimeMet / seatTimeTracked) * 100) : null;

    return {
      totalLearners,
      activeEnrollments,
      completedCourses,
      issuedCertificates,
      totalOnlineCeuHoursIssued: Number(ceHoursAgg._sum.ceHoursEarned ?? 0),
      examPassRate,
      examAttemptsGraded: examDenom,
      seatTimeComplianceRate,
      seatTimeTrackedEnrollments: seatTimeTracked,
      revenue: {
        totalRevenue: Number(revenueAgg._sum.total ?? 0),
        paidOrderCount: revenueAgg._count.id,
        subscriptionCount,
        refunds: 0,
        failedPayments: failedOrders,
        stripeStatus: 'placeholder_not_connected',
        currency: 'USD',
      },
      support: {
        openTickets,
        escalationQueue: 0,
        placeholder: false,
      },
    };
  }
}
