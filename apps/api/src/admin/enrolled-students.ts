import { Prisma } from '@calace/db';

/** Page size for the admin enrolled-students list. Totals always cover every record. */
export const ENROLLED_STUDENTS_PAGE_SIZE = 50;

/**
 * Internal accounts used to test Online CEU. Matched by email so a later student
 * with the same name is not removed. Records stay in the database.
 */
export const INTERNAL_TEST_EMAILS = [
  'calace@gmail.com',
  'camillernunez@gmail.com',
  'cliff.roperez@gmail.com',
  'deniese@calacenursingacademy.com',
  'ileenroperez@gmail.com',
  'jpaul.corpuz@gmail.com',
  'koryncal@gmail.com',
  'korynroasa@gmail.com',
  'korynroasa3@gmail.com',
  'marrianeelan@gmail.com',
  'milkie.roperez@gmail.com',
  'nieem@calacenursingacademy.com',
  'onlineceunit50@gmail.com',
  'saratan@gmail.com',
  'yzza@calacenursingacademy.com',
] as const;

/**
 * Students who are not development fixtures.
 * Each check is written so a missing name or missing seeded flag still counts as a real student.
 * Matching accounts and their enrollment records stay in the database.
 */
export function nonTestStudentWhere(): Prisma.UserWhereInput {
  return {
    AND: [
      { NOT: { email: { endsWith: '@example.com', mode: 'insensitive' } } },
      { NOT: { email: { endsWith: '.test', mode: 'insensitive' } } },
      { NOT: { email: { endsWith: '@gmail.acom', mode: 'insensitive' } } },
      { NOT: { email: { in: [...INTERNAL_TEST_EMAILS], mode: 'insensitive' } } },
      {
        OR: [
          { firstName: null },
          {
            NOT: {
              OR: [
                { firstName: { equals: 'test', mode: 'insensitive' } },
                { firstName: { startsWith: 'test ', mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      {
        OR: [
          { metadata: { path: ['seeded'], equals: Prisma.DbNull } },
          { metadata: { path: ['seeded'], equals: false } },
        ],
      },
    ],
  };
}

const KNOWN_PLAN_LABELS: Record<string, string> = {
  single: 'Single course',
  free: 'Free',
  'unlimited-1y': '1-Year Unlimited',
  'unlimited-2y': '2-Year Unlimited',
};

const PLAN_LABEL_ORDER = [
  '1-Year Unlimited',
  '2-Year Unlimited',
  'Single course',
  'Free',
  'Unlimited membership',
];

/**
 * Plan labels stored on one enrollment record.
 * An unrecognized plan code is kept so a new plan still shows and is never a reason to drop the student.
 */
export function enrollmentPlanLabels(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
  const meta = metadata as Record<string, unknown>;
  const labels = new Set<string>();

  if (typeof meta.purchasePlan === 'string' && meta.purchasePlan.trim()) {
    const code = meta.purchasePlan.trim();
    labels.add(KNOWN_PLAN_LABELS[code] ?? code);
  }
  if (meta.freeEnrollment === true) labels.add('Free');
  if (labels.size === 0 && meta.viaSubscription === true) labels.add('Unlimited membership');

  return [...labels];
}

/** Unique plan labels for one student, in a stable display order. */
export function mergePlanLabels(groups: string[][]): string[] {
  const labels = new Set<string>();
  for (const group of groups) {
    for (const label of group) labels.add(label);
  }
  return [...labels].sort((a, b) => {
    const ai = PLAN_LABEL_ORDER.indexOf(a);
    const bi = PLAN_LABEL_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
