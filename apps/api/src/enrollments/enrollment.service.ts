import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  EnrollmentStatus,
  LessonProgressStatus,
  OrderStatus,
  Prisma,
  ReferralRewardReason,
  ReferralStatus,
  SubscriptionStatus,
} from '@calace/db';

import { DEFAULT_TENANT_SLUG, ROLE_SLUG } from '../config/auth.constants';
import type { AuthUser } from '../auth/types/auth-user.type';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService, type EnrollmentMeta } from '../progress/progress.service';
import { isFreeFromCatalogData } from '../catalog/catalog-pricing.util';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentFulfillmentService } from './enrollment-fulfillment.service';
import type { EnrollmentFulfillmentResult } from './enrollment-fulfillment.types';
import { deriveLearnerState, type LearnerCourseState } from './learner-state';
import {
  isSubscriptionPlan,
  PLAN_PRICES,
  PURCHASE_PLANS,
  type PurchasePlan,
} from './pricing.constants';
import {
  enrollmentRequiresReset,
  MAX_ENROLLMENT_COURSE_ATTEMPTS,
  courseRestartPath,
} from './enrollment-attempt.constants';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
    private readonly notifications: NotificationsService,
    private readonly fulfillment: EnrollmentFulfillmentService,
    private readonly config: ConfigService,
  ) {}

  private async getTenantId() {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');
    return tenant.id;
  }

  private async mapEnrollment(
    enrollment: {
      id: string;
      status: EnrollmentStatus;
      attemptsUsed: number;
      enrolledAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
      metadata: Prisma.JsonValue;
      courseVersion: {
        id: string;
        course: { slug: string; title: string; ceHours: Prisma.Decimal };
      };
    },
    totalLessons?: number,
  ) {
    const total =
      totalLessons ??
      (await this.progress.countPublishedLessons(enrollment.courseVersion.id));
    const progressPct = await this.progress.computeProgressPct(
      enrollment.id,
      enrollment.courseVersion.id,
    );
    const meta = (enrollment.metadata ?? {}) as EnrollmentMeta;
    const learnerState = deriveLearnerState({
      status: enrollment.status,
      progressPct,
    });
    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        status: LessonProgressStatus.COMPLETED,
      },
    });

    const requiresReset = enrollmentRequiresReset(enrollment.status);
    const courseSlug = enrollment.courseVersion.course.slug;

    return {
      id: enrollment.id,
      courseVersionId: enrollment.courseVersion.id,
      courseSlug,
      courseTitle: enrollment.courseVersion.course.title,
      ceHours: Number(enrollment.courseVersion.course.ceHours),
      status: enrollment.status,
      learnerState,
      progressPct,
      totalLessons: total,
      completedLessons,
      lastLessonSlug: meta.lastLessonSlug ?? null,
      resumeLessonSlug: await this.progress.getResumeLessonSlug(
        enrollment.id,
        enrollment.courseVersion.id,
      ),
      enrolledAt: enrollment.enrolledAt.toISOString(),
      startedAt: enrollment.startedAt?.toISOString() ?? null,
      completedAt: enrollment.completedAt?.toISOString() ?? null,
      attemptsUsed: enrollment.attemptsUsed,
      maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
      requiresReset,
      canRestart: requiresReset,
      courseRestartPath: requiresReset ? courseRestartPath(courseSlug) : null,
      /** @deprecated Use requiresReset */
      requiresRepurchase: requiresReset,
      /** @deprecated Use courseRestartPath */
      repurchaseCheckoutPath: requiresReset ? courseRestartPath(courseSlug) : null,
      canAccessLearn:
        enrollment.status === EnrollmentStatus.ACTIVE ||
        enrollment.status === EnrollmentStatus.COMPLETED ||
        requiresReset,
    };
  }

  private async getPublishedCourseVersion(tenantId: string, slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId, slug, status: CourseStatus.PUBLISHED, deletedAt: null },
      include: {
        versions: {
          where: { status: CourseVersionStatus.PUBLISHED, deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            modules: {
              where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },
              include: {
                lessons: {
                  where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },
                },
              },
            },
          },
        },
      },
    });

    if (!course?.versions[0]) return null;
    return { course, version: course.versions[0] };
  }

  private async countLessons(courseVersionId: string) {
    return this.prisma.lesson.count({
      where: {
        deletedAt: null,
        status: ContentPublishStatus.PUBLISHED,
        module: { courseVersionId, deletedAt: null },
      },
    });
  }

  async getActiveSubscription(userId: string, tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        tenantId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
      },
      orderBy: { currentPeriodEnd: 'desc' },
    });
  }

  async listMyEnrollments(user: AuthUser) {
    const tenantId = user.tenantId;
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.userId, tenantId, deletedAt: null },
      include: {
        courseVersion: { include: { course: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const results = await Promise.all(enrollments.map((e) => this.mapEnrollment(e)));

    return results;
  }

  async getEnrollmentForCourse(user: AuthUser, courseSlug: string) {
    const tenantId = user.tenantId;
    const published = await this.getPublishedCourseVersion(tenantId, courseSlug);
    if (!published) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: user.userId,
        courseVersionId: published.version.id,
        deletedAt: null,
      },
      include: {
        courseVersion: { include: { course: true } },
      },
    });

    const totalLessons = await this.countLessons(published.version.id);
    const activeSubscription = await this.getActiveSubscription(user.userId, tenantId);

    if (!enrollment) {
      return {
        courseSlug,
        courseVersionId: published.version.id,
        enrollment: null,
        learnerState: 'not_enrolled' as LearnerCourseState,
        progressPct: 0,
        totalLessons,
        hasActiveSubscription: Boolean(activeSubscription),
        subscriptionPlanCode: activeSubscription?.planCode ?? null,
      };
    }

    const mapped = await this.mapEnrollment(enrollment, totalLessons);
    return {
      courseSlug,
      courseVersionId: published.version.id,
      enrollment: mapped,
      learnerState: mapped.learnerState,
      progressPct: mapped.progressPct,
      totalLessons,
      hasActiveSubscription: Boolean(activeSubscription),
      subscriptionPlanCode: activeSubscription?.planCode ?? null,
    };
  }

  private async createMockOrder(
    tenantId: string,
    userId: string,
    plan: PurchasePlan,
    courseSlug?: string | null,
  ) {
    const price = PLAN_PRICES[plan];
    const orderNumber = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return this.prisma.order.create({
      data: {
        tenantId,
        userId,
        orderNumber,
        status: OrderStatus.PAID,
        subtotal: price,
        total: price,
        lineItems: [
          {
            type: isSubscriptionPlan(plan) ? 'subscription' : 'course',
            plan,
            ...(courseSlug ? { courseSlug } : {}),
          },
        ] as Prisma.InputJsonValue,
        placedAt: new Date(),
        paymentMeta: { provider: 'mock', note: 'Placeholder checkout — Stripe not connected' },
      },
    });
  }

  async activateSubscriptionPurchase(user: AuthUser, plan: PurchasePlan) {
    if (!isSubscriptionPlan(plan)) {
      throw new BadRequestException('Plan must be an unlimited subscription');
    }

    await this.activateSubscription(user.tenantId, user.userId, plan);
    const order = await this.createMockOrder(user.tenantId, user.userId, plan);

    return {
      message: 'Subscription activated (mock checkout — no charge)',
      plan,
      orderId: order.id,
      subscriptionActivated: true,
    };
  }

  private async activateSubscription(
    tenantId: string,
    userId: string,
    plan: PurchasePlan,
    billingMeta?: Prisma.InputJsonValue,
  ) {
    const now = new Date();
    const end = new Date(now);
    if (plan === 'unlimited-1y') end.setFullYear(end.getFullYear() + 1);
    else end.setFullYear(end.getFullYear() + 2);

    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId, userId, planCode: plan },
    });

    const meta =
      billingMeta ?? (existing ? { mockRenewal: true } : { mockPurchase: true });

    if (existing) {
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          billingMeta: meta,
        },
      });
    }

    return this.prisma.subscription.create({
      data: {
        tenantId,
        userId,
        planCode: plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        billingMeta: meta,
      },
    });
  }

  async enroll(user: AuthUser, dto: CreateEnrollmentDto) {
    const tenantId = user.tenantId;
    const published = await this.getPublishedCourseVersion(tenantId, dto.courseSlug);
    if (!published) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findFirst({
      where: {
        userId: user.userId,
        courseVersionId: published.version.id,
        deletedAt: null,
      },
    });

    const isRepurchase =
      existing?.status === EnrollmentStatus.REQUIRES_REPURCHASE ||
      existing?.status === EnrollmentStatus.REQUIRES_RESET;

    if (
      existing &&
      existing.status !== EnrollmentStatus.WITHDRAWN &&
      !isRepurchase
    ) {
      throw new ConflictException('Already enrolled in this course');
    }

    const isFreeCourse = isFreeFromCatalogData(published.course.catalogData);
    const activeSubscription = await this.getActiveSubscription(user.userId, tenantId);
    let orderId: string | undefined;
    let viaSubscription = false;
    let freeEnrollment = false;

    if (dto.existingOrderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: dto.existingOrderId, userId: user.userId, tenantId },
      });
      if (!order) throw new BadRequestException('Order not found');
      orderId = order.id;
    } else if (isFreeCourse) {
      freeEnrollment = true;
    } else if (!dto.purchasePlan) {
      throw new BadRequestException('purchasePlan is required for paid courses');
    } else if (isSubscriptionPlan(dto.purchasePlan)) {
      await this.activateSubscription(tenantId, user.userId, dto.purchasePlan);
      const order = await this.createMockOrder(
        tenantId,
        user.userId,
        dto.purchasePlan,
        dto.courseSlug,
      );
      orderId = order.id;
    } else if (activeSubscription) {
      viaSubscription = true;
    } else {
      const order = await this.createMockOrder(
        tenantId,
        user.userId,
        'single',
        dto.courseSlug,
      );
      orderId = order.id;
    }

    const metadata: EnrollmentMeta = {
      progressPct: 0,
      purchasePlan: dto.purchasePlan,
      orderId,
      viaSubscription,
      freeEnrollment,
    };

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        userId_courseVersionId: {
          userId: user.userId,
          courseVersionId: published.version.id,
        },
      },
      create: {
        tenantId,
        userId: user.userId,
        courseVersionId: published.version.id,
        status: EnrollmentStatus.ACTIVE,
        metadata,
      },
      update: isRepurchase
        ? {
            status: EnrollmentStatus.ACTIVE,
            deletedAt: null,
            completedAt: null,
            attemptsUsed: 0,
            metadata: {
              ...metadata,
              repurchasedAt: new Date().toISOString(),
              priorAttemptsExhaustedAt:
                ((existing?.metadata as Record<string, unknown>)?.attemptsExhaustedAt as
                  | string
                  | null) ?? null,
            },
          }
        : {
            status: EnrollmentStatus.ACTIVE,
            deletedAt: null,
            metadata,
          },
      include: {
        courseVersion: { include: { course: true } },
      },
    });

    const totalLessons = await this.countLessons(published.version.id);

    void this.notifications
      .notifyEnrollmentConfirmed(
        tenantId,
        user.userId,
        enrollment.courseVersion.course.title,
        enrollment.courseVersion.course.slug,
      )
      .catch(() => undefined);

    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const courseUrl = `${webUrl.replace(/\/$/, '')}/courses/${enrollment.courseVersion.course.slug}`;
    void this.notifications
      .sendEnrollmentConfirmedEmail({
        tenantId,
        userId: user.userId,
        to: user.email,
        firstName: user.firstName ?? undefined,
        courseTitle: enrollment.courseVersion.course.title,
        courseUrl,
      })
      .catch(() => undefined);

    const credentialFulfillment = dto.skipCredentialFulfillment
      ? undefined
      : await this.runPostEnrollmentFulfillment({
          userId: user.userId,
          tenantId,
          courseSlug: dto.courseSlug,
          planType: dto.purchasePlan ?? 'single',
          enrollmentId: enrollment.id,
          orderId,
          activationSource:
            dto.activationSource ??
            (freeEnrollment ? 'free' : orderId ? 'mock' : 'subscription'),
        });

    const message = freeEnrollment
      ? credentialFulfillment?.complianceComplete
        ? 'Enrolled — certificate and transcript are ready'
        : 'Enrolled — this course is free'
      : viaSubscription
        ? credentialFulfillment?.complianceComplete
          ? 'Enrolled using your unlimited plan — certificate and transcript are ready'
          : 'Enrolled using your unlimited plan'
        : credentialFulfillment?.complianceComplete
          ? 'Enrollment successful — certificate and transcript are ready'
          : 'Enrollment successful (mock checkout)';

    return {
      message,
      enrollment: await this.mapEnrollment(enrollment, totalLessons),
      fulfillment: credentialFulfillment,
    };
  }

  async updateProgress(user: AuthUser, enrollmentId: string, dto: UpdateProgressDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId: user.userId, deletedAt: null },
      include: { courseVersion: { include: { course: true } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (dto.progressPct !== undefined && dto.progressPct >= 100) {
      const lessons = await this.prisma.lesson.findMany({
        where: {
          deletedAt: null,
          module: { courseVersionId: enrollment.courseVersionId },
        },
      });
      for (const lesson of lessons) {
        await this.progress.completeLesson(user, enrollmentId, lesson.id);
      }
    }

    const updated = await this.progress.syncEnrollmentProgress(enrollmentId);
    return this.mapEnrollment(updated);
  }

  async recordRecentView(user: AuthUser, courseSlug: string) {
    const published = await this.getPublishedCourseVersion(user.tenantId, courseSlug);
    if (!published) throw new NotFoundException('Course not found');

    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId: user.userId },
    });

    const profileData = (profile?.profileData ?? {}) as {
      recentlyViewed?: { slug: string; title: string; viewedAt: string }[];
    };

    const entry = {
      slug: courseSlug,
      title: published.course.title,
      viewedAt: new Date().toISOString(),
    };

    const recent = [
      entry,
      ...(profileData.recentlyViewed ?? []).filter((r) => r.slug !== courseSlug),
    ].slice(0, 6);

    await this.prisma.learnerProfile.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        tenantId: user.tenantId,
        profileData: { recentlyViewed: recent },
      },
      update: {
        profileData: { ...profileData, recentlyViewed: recent },
      },
    });

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: user.userId,
        courseVersionId: published.version.id,
        deletedAt: null,
      },
    });

    if (enrollment) {
      const meta = (enrollment.metadata ?? {}) as EnrollmentMeta;
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { metadata: { ...meta, lastViewedAt: entry.viewedAt } },
      });
    }

    return { ok: true };
  }

  async getRecentlyViewed(user: AuthUser) {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId: user.userId },
    });
    const profileData = (profile?.profileData ?? {}) as {
      recentlyViewed?: { slug: string; title: string; viewedAt: string }[];
    };
    return profileData.recentlyViewed ?? [];
  }

  async assertCanAccessLearn(user: AuthUser, courseSlug: string) {
    const status = await this.getEnrollmentForCourse(user, courseSlug);
    if (!status.enrollment?.canAccessLearn) {
      throw new BadRequestException('Enrollment required to access this course');
    }
    return status;
  }

  /** Wipe lesson progress, seat-time, and exam attempts; restore enrollment to Lesson 1. */
  async restartCourse(user: AuthUser, courseSlug: string) {
    const published = await this.getPublishedCourseVersion(user.tenantId, courseSlug);
    if (!published) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: user.userId,
        courseVersionId: published.version.id,
        deletedAt: null,
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (!enrollmentRequiresReset(enrollment.status)) {
      throw new BadRequestException(
        'Course restart is only available after exhausting all exam attempts.',
      );
    }

    const finalExam = await this.prisma.assessment.findFirst({
      where: {
        courseVersionId: published.version.id,
        kind: AssessmentKind.FINAL_EXAM,
        deletedAt: null,
      },
    });

    const meta = (enrollment.metadata ?? {}) as EnrollmentMeta;
    const now = new Date().toISOString();
    const emptyParticipation = {
      ledger: {
        version: 1,
        activeSeconds: 0,
        interactionCount: 0,
        sessionId: null,
        lastHeartbeatAt: null,
        lastActiveAt: null,
        lastInteractionAt: null,
        lastClientSequence: 0,
        lastScrollDepthPct: 0,
        pausedSince: null,
        lessonActiveSeconds: {},
        events: [],
        seatTimeMinutes: 0,
        deliveryMode: 'online',
      },
      seatTimeMinutes: 0,
      activeSeconds: 0,
      activeParticipationAcknowledged: false,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.lessonProgress.deleteMany({ where: { enrollmentId: enrollment.id } });

      if (finalExam) {
        await tx.assessmentAttempt.updateMany({
          where: {
            enrollmentId: enrollment.id,
            assessmentId: finalExam.id,
            status: { not: AssessmentAttemptStatus.VOIDED },
          },
          data: { status: AssessmentAttemptStatus.VOIDED },
        });
      }

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.ACTIVE,
          attemptsUsed: 0,
          activeParticipationSeconds: 0,
          completedAt: null,
          metadata: {
            ...meta,
            progressPct: 0,
            lastLessonId: undefined,
            lastLessonSlug: undefined,
            lastModuleSlug: undefined,
            activeParticipationAcknowledged: false,
            activeParticipationAcknowledgedAt: undefined,
            courseRestartedAt: now,
            priorAttemptsExhaustedAt:
              (meta as Record<string, unknown>).attemptsExhaustedAt ?? now,
            participation: emptyParticipation,
            fulfillment: {
              ...((meta as Record<string, unknown>).fulfillment as object),
              fulfillmentStatus: 'enrolled',
              requiresReset: false,
            },
          } as Prisma.InputJsonValue,
        },
      });
    });

    const totalLessons = await this.countLessons(published.version.id);
    const updated = await this.prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollment.id },
      include: {
        courseVersion: { include: { course: true } },
      },
    });

    return {
      message: 'Course restarted. Your lesson progress and seat-time have been reset.',
      enrollment: await this.mapEnrollment(updated, totalLessons),
      resumeLessonSlug: await this.progress.getResumeLessonSlug(
        enrollment.id,
        published.version.id,
      ),
    };
  }

  private async createStripeOrder(
    tenantId: string,
    userId: string,
    plan: PurchasePlan,
    courseSlug: string | null,
    paymentMeta: Prisma.InputJsonValue,
    amountTotal?: number,
  ) {
    const price = amountTotal != null ? amountTotal / 100 : PLAN_PRICES[plan];
    const orderNumber = `STRIPE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return this.prisma.order.create({
      data: {
        tenantId,
        userId,
        orderNumber,
        status: OrderStatus.PAID,
        subtotal: price,
        total: price,
        lineItems: [
          {
            type: isSubscriptionPlan(plan) ? 'subscription' : 'course',
            plan,
            courseSlug,
          },
        ] as Prisma.InputJsonValue,
        placedAt: new Date(),
        paymentMeta,
      },
    });
  }

  private async runPostEnrollmentFulfillment(params: {
    userId: string;
    tenantId: string;
    courseSlug: string;
    planType: PurchasePlan;
    enrollmentId: string;
    orderId?: string;
    activationSource: 'stripe' | 'free' | 'mock' | 'subscription';
  }): Promise<EnrollmentFulfillmentResult> {
    return this.fulfillment.fulfillEnrollmentCredentials({
      userId: params.userId,
      tenantId: params.tenantId,
      courseSlug: params.courseSlug,
      planType: params.planType,
      enrollmentId: params.enrollmentId,
      orderId: params.orderId,
      activationSource: params.activationSource,
    });
  }

  async fulfillStripePurchase(params: {
    userId: string;
    tenantId: string;
    plan: string;
    courseSlug?: string;
    /** @deprecated Hosted Checkout session id — use stripePaymentIntentId or stripeInvoiceId */
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    amountTotalCents?: number;
  }): Promise<{
    orderId: string;
    enrollmentId?: string;
    subscriptionActivated: boolean;
    fulfillmentNote: string;
    alreadyFulfilled: boolean;
    complianceComplete: boolean;
    certificateId?: string;
    completionId?: string;
    certificatePending: boolean;
  }> {
    if (!(PURCHASE_PLANS as readonly string[]).includes(params.plan)) {
      throw new BadRequestException('Invalid purchase plan in Stripe metadata');
    }

    const plan = params.plan as PurchasePlan;
    const courseSlug = params.courseSlug?.trim() || null;

    const idempotencyFilters = [
      params.stripePaymentIntentId
        ? { paymentMeta: { path: ['stripePaymentIntentId'], equals: params.stripePaymentIntentId } }
        : null,
      params.stripeInvoiceId
        ? { paymentMeta: { path: ['stripeInvoiceId'], equals: params.stripeInvoiceId } }
        : null,
      params.stripeSessionId
        ? { paymentMeta: { path: ['stripeSessionId'], equals: params.stripeSessionId } }
        : null,
    ].filter(Boolean) as Array<{
      paymentMeta: { path: string[]; equals: string };
    }>;

    const existing =
      idempotencyFilters.length > 0
        ? await this.prisma.order.findFirst({
            where: {
              userId: params.userId,
              tenantId: params.tenantId,
              OR: idempotencyFilters,
            },
          })
        : null;

    if (existing) {
      const paymentMeta = (existing.paymentMeta ?? {}) as {
        enrollmentId?: string;
        certificateId?: string;
        completionId?: string;
        complianceComplete?: boolean;
        certificatePending?: boolean;
        fulfillmentStatus?: string;
        courseSlug?: string;
      };

      let credentialFulfillment: EnrollmentFulfillmentResult | null = null;
      if (
        paymentMeta.enrollmentId &&
        paymentMeta.courseSlug &&
        paymentMeta.fulfillmentStatus === 'certificate_pending'
      ) {
        credentialFulfillment = await this.runPostEnrollmentFulfillment({
          userId: params.userId,
          tenantId: params.tenantId,
          courseSlug: paymentMeta.courseSlug,
          planType: plan,
          enrollmentId: paymentMeta.enrollmentId,
          orderId: existing.id,
          activationSource: 'stripe',
        });
      }

      return {
        orderId: existing.id,
        enrollmentId: paymentMeta.enrollmentId,
        subscriptionActivated: isSubscriptionPlan(plan),
        fulfillmentNote:
          credentialFulfillment?.note ?? 'Stripe checkout already fulfilled',
        alreadyFulfilled: true,
        complianceComplete:
          credentialFulfillment?.complianceComplete ??
          Boolean(paymentMeta.complianceComplete),
        certificateId: credentialFulfillment?.certificateId ?? paymentMeta.certificateId,
        completionId: credentialFulfillment?.completionId ?? paymentMeta.completionId,
        certificatePending:
          credentialFulfillment?.certificatePending ??
          Boolean(paymentMeta.certificatePending),
      };
    }

    const paymentMeta: Prisma.InputJsonValue = {
      provider: 'stripe',
      stripeSessionId: params.stripeSessionId ?? null,
      stripePaymentIntentId: params.stripePaymentIntentId ?? null,
      stripeInvoiceId: params.stripeInvoiceId ?? null,
      stripeCustomerId: params.stripeCustomerId ?? null,
      stripeSubscriptionId: params.stripeSubscriptionId ?? null,
      mode: 'elements',
    };

    const order = await this.createStripeOrder(
      params.tenantId,
      params.userId,
      plan,
      courseSlug,
      paymentMeta,
      params.amountTotalCents,
    );

    let subscriptionActivated = false;
    if (isSubscriptionPlan(plan)) {
      await this.activateSubscription(params.tenantId, params.userId, plan, {
        provider: 'stripe',
        stripeSessionId:
          params.stripeInvoiceId ??
          params.stripePaymentIntentId ??
          params.stripeSessionId ??
          null,
        stripeSubscriptionId: params.stripeSubscriptionId ?? null,
        stripeCustomerId: params.stripeCustomerId ?? null,
      });
      subscriptionActivated = true;
    }

    let enrollmentId: string | undefined;
    let credentialFulfillment: EnrollmentFulfillmentResult | null = null;
    let courseTitle: string | undefined;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, emailVerifiedAt: true, firstName: true, lastName: true },
    });
    if (!dbUser) throw new BadRequestException('User not found for Stripe fulfillment');

    if (courseSlug) {
      const authUser: AuthUser = {
        sub: params.userId,
        userId: params.userId,
        email: dbUser.email,
        tenantId: params.tenantId,
        roles: [ROLE_SLUG.LEARNER],
        emailVerified: Boolean(dbUser.emailVerifiedAt),
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
      };

      const enrollResult = await this.enroll(authUser, {
        courseSlug,
        purchasePlan: plan,
        existingOrderId: order.id,
        activationSource: 'stripe',
        skipCredentialFulfillment: true,
      });
      enrollmentId = enrollResult.enrollment.id;
      courseTitle = enrollResult.enrollment.courseTitle;

      credentialFulfillment = await this.runPostEnrollmentFulfillment({
        userId: params.userId,
        tenantId: params.tenantId,
        courseSlug,
        planType: plan,
        enrollmentId,
        orderId: order.id,
        activationSource: 'stripe',
      });
    }

    await this.handleReferralConversion(params.userId, params.tenantId).catch(
      () => undefined,
    );

    this.sendStripePaymentNotifications({
      tenantId: params.tenantId,
      userId: params.userId,
      email: dbUser.email,
      firstName: dbUser.firstName,
      plan,
      orderNumber: order.orderNumber,
      amountUsd: Number(order.total),
      courseSlug,
      courseTitle,
    }).catch(() => undefined);

    return {
      orderId: order.id,
      enrollmentId,
      subscriptionActivated,
      fulfillmentNote:
        credentialFulfillment?.note ??
        (courseSlug
          ? 'Enrollment activated. Complete course requirements to release your certificate.'
          : 'Subscription activated. Enroll in a course to begin earning CEUs.'),
      alreadyFulfilled: false,
      complianceComplete: credentialFulfillment?.complianceComplete ?? false,
      certificateId: credentialFulfillment?.certificateId,
      completionId: credentialFulfillment?.completionId,
      certificatePending: credentialFulfillment?.certificatePending ?? false,
    };
  }

  private async sendStripePaymentNotifications(params: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string | null;
    plan: PurchasePlan;
    orderNumber: string;
    amountUsd: number;
    courseSlug: string | null;
    courseTitle?: string;
  }) {
    const webUrl = (this.config.get<string>('WEB_URL') ?? 'https://onlineceunits.com').replace(
      /\/$/,
      '',
    );
    const actionUrl = params.courseSlug
      ? `${webUrl}/courses/${params.courseSlug}`
      : `${webUrl}/dashboard`;
    const planLabel =
      params.plan === 'unlimited-1y'
        ? 'Unlimited 1-year access'
        : params.plan === 'unlimited-2y'
          ? 'Unlimited 2-year access'
          : 'Single course';
    const amountLabel = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(params.amountUsd);

    await Promise.all([
      this.notifications.sendPaymentReceivedEmail({
        tenantId: params.tenantId,
        userId: params.userId,
        to: params.email,
        firstName: params.firstName ?? undefined,
        amountUsd: params.amountUsd,
        plan: params.plan,
        orderNumber: params.orderNumber,
        courseTitle: params.courseTitle,
        actionUrl,
      }),
      this.notifications.notifyPaymentReceived(
        params.tenantId,
        params.userId,
        amountLabel,
        planLabel,
      ),
    ]);
  }

  private async handleReferralConversion(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const referral = await this.prisma.referral.findFirst({
      where: {
        referreeId: userId,
        tenantId,
        status: ReferralStatus.PENDING,
      },
      select: {
        id: true,
        referrerId: true,
        rewardAmountCents: true,
      },
    });

    if (!referral) return;

    const orderCount = await this.prisma.order.count({
      where: {
        userId,
        tenantId,
        status: OrderStatus.PAID,
      },
    });

    if (orderCount !== 1) return;

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: ReferralStatus.REWARDED,
          convertedAt: now,
          rewardedAt: now,
        },
      }),
      this.prisma.referralReward.create({
        data: {
          tenantId,
          userId: referral.referrerId,
          amountCents: referral.rewardAmountCents ?? 375,
          reason: ReferralRewardReason.REFERRAL_CONVERSION,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    if (this.notifications) {
      const referrer = await this.prisma.user.findUnique({
        where: { id: referral.referrerId },
        select: { firstName: true },
      });
      await this.notifications
        .notifyReferralConverted(
          tenantId,
          referral.referrerId,
          referrer?.firstName ?? undefined,
        )
        .catch(() => undefined);
    }
  }

  async retryPendingCertificates(tenantId: string): Promise<{
    found: number;
    retried: number;
    succeeded: number;
    failed: number;
    results: Array<{
      orderId: string;
      enrollmentId: string;
      previousStatus: string;
      newStatus: string;
      error?: string;
    }>;
  }> {
    const now = new Date();
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: OrderStatus.PAID,
        paymentMeta: {
          path: ['fulfillmentStatus'],
          equals: 'certificate_pending',
        },
      },
    });

    const pendingOrders = orders.filter((order) => {
      const paymentMeta = (order.paymentMeta ?? {}) as Record<string, unknown>;
      const retryAt = paymentMeta.fulfillmentRetryAt;
      if (typeof retryAt !== 'string') return false;
      return new Date(retryAt) <= now;
    });

    const results: Array<{
      orderId: string;
      enrollmentId: string;
      previousStatus: string;
      newStatus: string;
      error?: string;
    }> = [];
    let retried = 0;
    let succeeded = 0;
    let failed = 0;

    for (const order of pendingOrders) {
      const paymentMeta = (order.paymentMeta ?? {}) as Record<string, unknown>;
      const previousStatus = String(paymentMeta.fulfillmentStatus ?? 'certificate_pending');
      const enrollmentId = paymentMeta.enrollmentId;
      const userId =
        typeof paymentMeta.userId === 'string' ? paymentMeta.userId : order.userId;

      if (typeof enrollmentId !== 'string' || !userId) {
        failed += 1;
        results.push({
          orderId: order.id,
          enrollmentId: typeof enrollmentId === 'string' ? enrollmentId : '',
          previousStatus,
          newStatus: previousStatus,
          error: 'Missing enrollmentId or userId in paymentMeta',
        });
        continue;
      }

      const courseSlug = paymentMeta.courseSlug;
      if (typeof courseSlug !== 'string') {
        failed += 1;
        results.push({
          orderId: order.id,
          enrollmentId,
          previousStatus,
          newStatus: previousStatus,
          error: 'Missing courseSlug in paymentMeta',
        });
        continue;
      }

      const planTypeRaw = paymentMeta.planType;
      const planType: PurchasePlan =
        typeof planTypeRaw === 'string' &&
        (PURCHASE_PLANS as readonly string[]).includes(planTypeRaw)
          ? (planTypeRaw as PurchasePlan)
          : 'single';

      retried += 1;
      let newStatus = previousStatus;
      let error: string | undefined;

      try {
        const fulfillmentResult = await this.runPostEnrollmentFulfillment({
          userId,
          tenantId,
          courseSlug,
          planType,
          enrollmentId,
          orderId: order.id,
          activationSource: 'stripe',
        });
        newStatus = fulfillmentResult.status;
        if (fulfillmentResult.status !== 'certificate_pending') {
          succeeded += 1;
        } else {
          failed += 1;
          error = fulfillmentResult.fulfillmentError;
        }
      } catch (err) {
        failed += 1;
        error = err instanceof Error ? err.message : 'Retry failed';
      }

      const freshOrder = await this.prisma.order.findUnique({
        where: { id: order.id },
        select: { paymentMeta: true },
      });
      const existingMeta = (freshOrder?.paymentMeta ?? {}) as Record<string, unknown>;
      const retryCount =
        (typeof existingMeta.retryCount === 'number' ? existingMeta.retryCount : 0) + 1;

      const updatedMeta: Record<string, unknown> = {
        ...existingMeta,
        lastRetryAt: new Date().toISOString(),
        retryCount,
      };

      if (newStatus !== 'certificate_pending') {
        delete updatedMeta.fulfillmentRetryAt;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentMeta: updatedMeta as Prisma.InputJsonValue },
      });

      results.push({
        orderId: order.id,
        enrollmentId,
        previousStatus,
        newStatus,
        ...(error ? { error } : {}),
      });
    }

    return {
      found: pendingOrders.length,
      retried,
      succeeded,
      failed,
      results,
    };
  }
}
