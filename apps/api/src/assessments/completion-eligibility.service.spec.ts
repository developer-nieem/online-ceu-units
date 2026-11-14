import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  ContentPublishStatus,
  EnrollmentStatus,
  LessonProgressStatus,
} from '@calace/db';

import { CompletionEligibilityService } from './completion-eligibility.service';
import type { ParticipationService } from '../participation/participation.service';
import type { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import type { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_PROVIDER_COMPLIANCE_SETTINGS } from '../provider-compliance/provider-compliance.settings';

const USER = { userId: 'user-1', tenantId: 'tenant-1', roles: ['learner'] };
const ENROLLMENT_ID = 'enr-1';

function allGatesMetMetadata() {
  return {
    certificateAttestationAt: '2026-01-01T00:00:00.000Z',
    activeParticipationAcknowledged: true,
    participation: { activeParticipationAcknowledged: true },
  };
}

function complianceAllMet() {
  return {
    activeMinutes: 480,
    seatTimeMet: true,
    interactionCount: 5,
  };
}

function makeLesson(id: string, slug: string) {
  return {
    id,
    slug,
    content: { type: 'doc', blocks: [] },
    deletedAt: null,
    status: ContentPublishStatus.PUBLISHED,
  };
}

function makeEnrollment(overrides: {
  modules?: Array<{ lessons: ReturnType<typeof makeLesson>[] }>;
  assessments?: Array<{
    id: string;
    settings?: Record<string, unknown>;
    questionCount?: number;
    maxAttempts?: number;
  }>;
  metadata?: Record<string, unknown>;
  lessonProgress?: Array<{
    lessonId: string;
    status: LessonProgressStatus;
    metadata?: Record<string, unknown>;
  }>;
}) {
  return {
    id: ENROLLMENT_ID,
    userId: USER.userId,
    tenantId: USER.tenantId,
    status: EnrollmentStatus.ACTIVE,
    attemptsUsed: 0,
    metadata: overrides.metadata ?? allGatesMetMetadata(),
    courseVersion: {
      ceHours: 8,
      modules: overrides.modules ?? [],
      assessments: (overrides.assessments ?? []).map((a) => ({
        id: a.id,
        deletedAt: null,
        kind: AssessmentKind.FINAL_EXAM,
        settings: a.settings ?? { requireAllLessons: false, activeParticipationRequired: false },
        maxAttempts: a.maxAttempts ?? 3,
        passingScore: 80,
        _count: { questions: a.questionCount ?? 0 },
      })),
      course: { slug: 'test-course' },
    },
    lessonProgress: overrides.lessonProgress ?? [],
  };
}

describe('CompletionEligibilityService.evaluate content-existence floor', () => {
  let service: CompletionEligibilityService;
  let mockPrisma: PrismaService;
  let mockParticipation: ParticipationService;
  let mockProviderSettings: ProviderComplianceSettingsService;

  beforeEach(() => {
    mockPrisma = {
      enrollment: { findFirst: vi.fn() },
      assessmentAttempt: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    mockParticipation = {
      getStatusForEnrollment: vi.fn().mockResolvedValue(complianceAllMet()),
    } as unknown as ParticipationService;

    mockProviderSettings = {
      getForTenant: vi.fn().mockResolvedValue(DEFAULT_PROVIDER_COMPLIANCE_SETTINGS),
    } as unknown as ProviderComplianceSettingsService;

    service = new CompletionEligibilityService(
      mockPrisma,
      mockParticipation,
      mockProviderSettings,
    );
  });

  it('returns ineligible when course has no lessons and no final exam', async () => {
    vi.mocked(mockPrisma.enrollment.findFirst).mockResolvedValue(
      makeEnrollment({ modules: [], assessments: [] }) as never,
    );

    const result = await service.evaluate(USER, ENROLLMENT_ID);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      'This course has no completable content and cannot be completed.',
    );
    expect(result.checks.enrolled).toBe(true);
  });

  it('returns ineligible when course has no lessons and a zero-question final exam', async () => {
    vi.mocked(mockPrisma.enrollment.findFirst).mockResolvedValue(
      makeEnrollment({
        modules: [],
        assessments: [{ id: 'exam-1', questionCount: 0 }],
      }) as never,
    );

    const result = await service.evaluate(USER, ENROLLMENT_ID);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      'This course has no completable content and cannot be completed.',
    );
  });

  it('returns eligible for exam-only course when exam has questions and is passed', async () => {
    vi.mocked(mockPrisma.enrollment.findFirst).mockResolvedValue(
      makeEnrollment({
        modules: [],
        assessments: [{ id: 'exam-1', questionCount: 10 }],
      }) as never,
    );
    vi.mocked(mockPrisma.assessmentAttempt.findMany).mockResolvedValue([
      {
        status: AssessmentAttemptStatus.PASSED,
        score: 90,
      },
    ] as never);

    const result = await service.evaluate(USER, ENROLLMENT_ID);

    expect(result.eligible).toBe(true);
    expect(result.reasons).not.toContain(
      'This course has no completable content and cannot be completed.',
    );
  });

  it('returns eligible for lesson-only course when lessons are complete and no exam exists', async () => {
    const lesson = makeLesson('lesson-1', 'intro');
    vi.mocked(mockPrisma.enrollment.findFirst).mockResolvedValue(
      makeEnrollment({
        modules: [{ lessons: [lesson] }],
        assessments: [],
        lessonProgress: [
          { lessonId: 'lesson-1', status: LessonProgressStatus.COMPLETED },
        ],
      }) as never,
    );

    const result = await service.evaluate(USER, ENROLLMENT_ID);

    expect(result.eligible).toBe(true);
    expect(result.reasons).not.toContain(
      'This course has no completable content and cannot be completed.',
    );
  });
});
