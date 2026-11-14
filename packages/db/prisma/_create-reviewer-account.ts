/**
 * CDPH review deployment — pre-provisioned reviewer learner account.
 * REVIEW-ONLY: run manually against the review deploy database.
 *
 * Patterns mirrored from seed-dev-auth.ts, seed-enrollments.ts, and auth.service.ts.
 */
import { randomBytes } from 'crypto';

import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/** Matches apps/api auth.service.ts BCRYPT_ROUNDS */
const BCRYPT_ROUNDS = 12;

const TENANT_SLUG = 'cal-ace';
const ROLE_SLUG = 'learner';
const REVIEWER_EMAIL = 'cna-test@cna.school';
const REVIEWER_PASSWORD = 'CNA-Password456';

/** Same algorithm as apps/api/src/auth/auth.service.ts generateReferralCode() */
function generateReferralCode(): string {
  const bytes = randomBytes(5);
  let digits = '';
  for (let i = 0; i < 5; i++) {
    digits += (bytes[i]! % 10).toString();
  }
  return `CAL${digits}`;
}

function isReferralCodeCollision(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!tenant) {
    throw new Error(`Tenant not found: slug=${TENANT_SLUG}`);
  }

  const learnerRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, slug: ROLE_SLUG, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!learnerRole) {
    throw new Error(`Learner role not found for tenant ${TENANT_SLUG}`);
  }

  const passwordHash = await bcrypt.hash(REVIEWER_PASSWORD, BCRYPT_ROUNDS);
  const now = new Date();

  const authFields = {
    passwordHash,
    firstName: 'CNA',
    lastName: 'Test',
    status: UserStatus.ACTIVE,
    emailVerifiedAt: now,
    termsAcceptedAt: now,
    failedLoginCount: 0,
    lockedUntil: null,
    deletedAt: null,
  };

  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: REVIEWER_EMAIL },
    select: { id: true },
  });

  let user;
  let action: 'created' | 'updated';

  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: authFields,
    });
    action = 'updated';
  } else {
    const createData = () => ({
      tenantId: tenant.id,
      email: REVIEWER_EMAIL,
      referralCode: generateReferralCode(),
      metadata: {
        seeded: true,
        note: 'CDPH review deployment — pre-provisioned reviewer account.',
      },
      ...authFields,
    });

    try {
      user = await prisma.user.create({ data: createData() });
    } catch (err: unknown) {
      if (isReferralCodeCollision(err)) {
        user = await prisma.user.create({ data: createData() });
      } else {
        throw err;
      }
    }
    action = 'created';
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId_tenantId: {
        userId: user.id,
        roleId: learnerRole.id,
        tenantId: tenant.id,
      },
    },
    create: {
      userId: user.id,
      roleId: learnerRole.id,
      tenantId: tenant.id,
    },
    update: {},
  });

  await prisma.learnerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      tenantId: tenant.id,
    },
    update: {
      tenantId: tenant.id,
      deletedAt: null,
    },
  });

  const verified = await prisma.user.findFirst({
    where: { id: user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      emailVerifiedAt: true,
      userRoles: { include: { role: { select: { slug: true } } } },
      learnerProfile: { select: { id: true } },
    },
  });

  const passwordOk = await bcrypt.compare(
    REVIEWER_PASSWORD,
    (
      await prisma.user.findFirst({
        where: { id: user.id },
        select: { passwordHash: true },
      })
    )!.passwordHash!,
  );

  console.log(`Reviewer account ${action}`);
  console.log('  email:', verified?.email);
  console.log('  name:', `${verified?.firstName} ${verified?.lastName}`);
  console.log('  status:', verified?.status);
  console.log('  emailVerified:', Boolean(verified?.emailVerifiedAt));
  console.log(
    '  roles:',
    verified?.userRoles.map((ur) => ur.role.slug).join(', '),
  );
  console.log('  learnerProfile:', verified?.learnerProfile ? 'yes' : 'no');
  console.log('  passwordHashValid:', passwordOk);
  console.log('  tenant:', tenant.slug, `(${tenant.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
