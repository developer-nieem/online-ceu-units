import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditService } from '../audit/audit.service';
import type { ComplianceService } from '../credentials/compliance.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminLearnersService } from './admin-learners.service';
import { ENROLLED_STUDENTS_PAGE_SIZE, nonTestStudentWhere } from './enrolled-students';

const TENANT_ID = 'tenant-cal-ace';

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    _count: { enrollments: 1 },
    enrollments: [
      {
        enrolledAt: new Date('2026-06-01T00:00:00.000Z'),
        metadata: { purchasePlan: 'unlimited-1y' },
      },
    ],
    ...overrides,
  };
}

function createHarness() {
  const prisma = {
    tenant: {
      findFirst: vi.fn().mockResolvedValue({ id: TENANT_ID }),
    },
    user: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    enrollment: {
      count: vi.fn().mockResolvedValue(0),
    },
  };
  const service = new AdminLearnersService(
    prisma as unknown as PrismaService,
    {} as ComplianceService,
    {} as AuditService,
  );
  return { service, prisma };
}

describe('AdminLearnersService.listEnrolledStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes students from every plan and counts a person once across multiple enrollments', async () => {
    const { service, prisma } = createHarness();
    prisma.user.count.mockResolvedValue(3);
    prisma.enrollment.count.mockResolvedValue(4);
    prisma.user.findMany.mockResolvedValue([
      userRow({
        id: 'user-1y',
        email: 'one@example.com',
        firstName: 'One',
        lastName: 'Year',
        _count: { enrollments: 1 },
        enrollments: [
          {
            enrolledAt: new Date('2026-05-01T00:00:00.000Z'),
            metadata: { purchasePlan: 'unlimited-1y' },
          },
        ],
      }),
      userRow({
        id: 'user-2y',
        email: 'two@example.com',
        firstName: 'Two',
        lastName: 'Year',
        _count: { enrollments: 2 },
        enrollments: [
          {
            enrolledAt: new Date('2026-07-02T00:00:00.000Z'),
            metadata: { purchasePlan: 'unlimited-2y' },
          },
          {
            enrolledAt: new Date('2026-07-01T00:00:00.000Z'),
            metadata: { purchasePlan: 'single' },
          },
        ],
      }),
      userRow({
        id: 'user-other',
        email: 'free@example.com',
        firstName: 'Free',
        lastName: 'Course',
        _count: { enrollments: 1 },
        enrollments: [
          {
            enrolledAt: new Date('2026-04-01T00:00:00.000Z'),
            metadata: { freeEnrollment: true, purchasePlan: 'cohort-2026' },
          },
        ],
      }),
    ]);

    const result = await service.listEnrolledStudents();

    expect(result.totalEnrolledStudents).toBe(3);
    expect(result.totalEnrollments).toBe(4);
    expect(result.students).toHaveLength(3);
    expect(result.students.map((student) => student.plans)).toEqual([
      ['1-Year Unlimited'],
      ['2-Year Unlimited', 'Single course'],
      ['Free', 'cohort-2026'],
    ]);
    expect(result.students[1]).toMatchObject({
      userId: 'user-2y',
      enrollmentCount: 2,
      latestEnrolledAt: '2026-07-02T00:00:00.000Z',
    });
    expect(result.matchingStudents).toBeUndefined();

    const studentWhere = prisma.user.count.mock.calls[0]?.[0]?.where;
    const enrollmentWhere = prisma.enrollment.count.mock.calls[0]?.[0]?.where;
    expect(studentWhere).toEqual({
      tenantId: TENANT_ID,
      enrollments: { some: { tenantId: TENANT_ID, deletedAt: null } },
      AND: [nonTestStudentWhere()],
    });
    expect(enrollmentWhere).toEqual({
      tenantId: TENANT_ID,
      deletedAt: null,
      user: { is: nonTestStudentWhere() },
    });
    expect(JSON.stringify(studentWhere)).not.toContain('unlimited-2y');
    expect(JSON.stringify(enrollmentWhere)).not.toContain('planCode');
  });

  it('keeps full totals when a search narrows the name list', async () => {
    const { service, prisma } = createHarness();
    prisma.user.count.mockImplementation(async ({ where }) => (where.OR ? 1 : 5));
    prisma.enrollment.count.mockImplementation(async ({ where }) =>
      JSON.stringify(where.user).includes('contains') ? 2 : 9,
    );
    prisma.user.findMany.mockResolvedValue([
      userRow({
        _count: { enrollments: 2 },
        enrollments: [
          { enrolledAt: new Date('2026-06-02T00:00:00.000Z'), metadata: { purchasePlan: 'single' } },
          {
            enrolledAt: new Date('2026-06-01T00:00:00.000Z'),
            metadata: { purchasePlan: 'unlimited-1y' },
          },
        ],
      }),
    ]);

    const result = await service.listEnrolledStudents({ search: ' Ada ' });

    expect(result.totalEnrolledStudents).toBe(5);
    expect(result.totalEnrollments).toBe(9);
    expect(result.matchingStudents).toBe(1);
    expect(result.matchingEnrollments).toBe(2);
    expect(result.students).toHaveLength(1);
    expect(result.students[0]?.enrollmentCount).toBe(2);

    const listWhere = prisma.user.findMany.mock.calls[0]?.[0]?.where;
    expect(listWhere.OR).toEqual([
      { email: { contains: 'Ada', mode: 'insensitive' } },
      { firstName: { contains: 'Ada', mode: 'insensitive' } },
      { lastName: { contains: 'Ada', mode: 'insensitive' } },
    ]);
    expect(listWhere.enrollments).toEqual({
      some: { tenantId: TENANT_ID, deletedAt: null },
    });
  });

  it('pages the name list without changing the totals', async () => {
    const { service, prisma } = createHarness();
    prisma.user.count.mockResolvedValue(60);
    prisma.enrollment.count.mockResolvedValue(80);

    const result = await service.listEnrolledStudents({ page: 2 });

    expect(result.totalEnrolledStudents).toBe(60);
    expect(result.totalEnrollments).toBe(80);
    expect(result.page).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(result.pageSize).toBe(ENROLLED_STUDENTS_PAGE_SIZE);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: ENROLLED_STUDENTS_PAGE_SIZE,
        take: ENROLLED_STUDENTS_PAGE_SIZE,
      }),
    );
  });
});
