/**

 * Development-only staff credentials for local CMS/auth testing.

 *

 * Dev password (local seed only): SuccesS8@8

 * Accounts: support@cna.school (admin), instructor@cna.school (instructor)

 *

 * WARNING: Dev passwords are written ONLY when SEED_DEV_PASSWORDS=true (never in production).

 */

import { PrismaClient, UserStatus } from '@prisma/client';

import * as bcrypt from 'bcrypt';



/** Matches apps/api auth.service.ts BCRYPT_ROUNDS */

const BCRYPT_ROUNDS = 12;



/** Development-only — see docs/CMS.md and docs/AUTH.md */

export const DEV_SEED_STAFF_PASSWORD = 'SuccesS8@8';



export const DEV_SEED_ADMIN_EMAIL = 'support@cna.school';

export const DEV_SEED_INSTRUCTOR_EMAIL = 'instructor@cna.school';



/** Previous dev staff logins — migrated or retired on seed. */

const LEGACY_DEV_ADMIN_EMAIL = 'admin@renewal.cna.school';

const LEGACY_DEV_INSTRUCTOR_EMAIL = 'instructor@renewal.cna.school';



const STAFF_ACCOUNTS = [

  {

    email: DEV_SEED_ADMIN_EMAIL,

    firstName: 'CAL ACE',

    lastName: 'Admin',

    roleKey: 'admin' as const,

    referralCode: 'DEVADM01',

  },

  {

    email: DEV_SEED_INSTRUCTOR_EMAIL,

    firstName: 'CAL ACE',

    lastName: 'Instructor',

    roleKey: 'instructor' as const,

    referralCode: 'DEVINST01',

  },

];



type DevAuthFields = {

  passwordHash?: string;

  emailVerifiedAt: Date;

  status: UserStatus;

  failedLoginCount: number;

  lockedUntil: null;

  deletedAt: null;

};



/**
 * Fail-closed gate for writing development staff/demo passwords.
 *
 * Dev passwords (e.g. DEV_SEED_STAFF_PASSWORD) are written ONLY when
 * SEED_DEV_PASSWORDS is explicitly the string 'true'. There is deliberately
 * NO NODE_ENV fallback: an unset or misconfigured environment must fail closed
 * (no dev credentials written), never fall through to writing them. This
 * prevents the known dev password from ever reaching a remote/production
 * database by accident. Set SEED_DEV_PASSWORDS=true ONLY in local/dev envs you
 * fully control; never in production.
 */
export function isDevSeedContext(): boolean {
  return process.env.SEED_DEV_PASSWORDS === 'true';
}



export async function hashDevStaffPassword(): Promise<string | undefined> {

  if (!isDevSeedContext()) return undefined;

  return bcrypt.hash(DEV_SEED_STAFF_PASSWORD, BCRYPT_ROUNDS);

}



/**

 * Dev migration: rename legacy staff email when alone, otherwise deactivate duplicate.

 */

async function migrateLegacyStaffEmail(

  prisma: PrismaClient,

  tenantId: string,

  legacyEmail: string,

  canonicalEmail: string,

  roleId: string,

  devAuth: DevAuthFields,

  names: { firstName: string; lastName: string },

): Promise<void> {

  if (!isDevSeedContext()) return;



  const legacy = await prisma.user.findFirst({

    where: { tenantId, email: legacyEmail },

  });

  if (!legacy) return;



  const canonical = await prisma.user.findFirst({

    where: { tenantId, email: canonicalEmail },

  });



  if (!canonical) {

    await prisma.user.update({

      where: { id: legacy.id },

      data: {

        email: canonicalEmail,

        firstName: names.firstName,

        lastName: names.lastName,

        ...devAuth,

        metadata: {

          ...((legacy.metadata ?? {}) as object),

          seeded: true,

          migratedFrom: legacyEmail,

        },

      },

    });

    return;

  }



  if (legacy.id === canonical.id) return;



  await prisma.userRole.upsert({

    where: {

      userId_roleId_tenantId: {

        userId: canonical.id,

        roleId,

        tenantId,

      },

    },

    create: { userId: canonical.id, roleId, tenantId },

    update: {},

  });



  await prisma.user.update({

    where: { id: legacy.id },

    data: {

      deletedAt: new Date(),

      status: UserStatus.DEACTIVATED,

      metadata: {

        ...((legacy.metadata ?? {}) as object),

        retiredDevStaff: true,

        replacedBy: canonicalEmail,

      },

    },

  });



  await prisma.refreshSession.updateMany({

    where: { userId: legacy.id, revokedAt: null },

    data: { revokedAt: new Date() },

  });

}



/** Idempotent: (re)apply dev staff users, roles, and password hashes. */

export async function seedDevStaffUsers(

  prisma: PrismaClient,

  params: {

    tenantId: string;

    jurisdictionId: string;

    professionId: string;

    roleIds: { admin: string; instructor: string };

  },

): Promise<void> {

  const passwordHash = await hashDevStaffPassword();

  const devAuth: DevAuthFields = passwordHash

    ? {

        passwordHash,

        emailVerifiedAt: new Date(),

        status: UserStatus.ACTIVE,

        failedLoginCount: 0,

        lockedUntil: null,

        deletedAt: null,

      }

    : {

        emailVerifiedAt: new Date(),

        status: UserStatus.ACTIVE,

        failedLoginCount: 0,

        lockedUntil: null,

        deletedAt: null,

      };



  await migrateLegacyStaffEmail(

    prisma,

    params.tenantId,

    LEGACY_DEV_ADMIN_EMAIL,

    DEV_SEED_ADMIN_EMAIL,

    params.roleIds.admin,

    devAuth,

    { firstName: 'CAL ACE', lastName: 'Admin' },

  );

  await migrateLegacyStaffEmail(

    prisma,

    params.tenantId,

    LEGACY_DEV_INSTRUCTOR_EMAIL,

    DEV_SEED_INSTRUCTOR_EMAIL,

    params.roleIds.instructor,

    devAuth,

    { firstName: 'CAL ACE', lastName: 'Instructor' },

  );



  for (const account of STAFF_ACCOUNTS) {

    const roleId =

      account.roleKey === 'admin' ? params.roleIds.admin : params.roleIds.instructor;



    const user = await prisma.user.upsert({

      where: {

        tenantId_email: { tenantId: params.tenantId, email: account.email },

      },

      create: {

        tenantId: params.tenantId,

        email: account.email,

        firstName: account.firstName,

        lastName: account.lastName,

        referralCode: account.referralCode,

        ...devAuth,

        metadata: {

          seeded: true,

          devCredentials: Boolean(passwordHash),

          note: passwordHash

            ? `Dev password ${DEV_SEED_STAFF_PASSWORD} — docs/CMS.md (development only).`

            : 'No default password in production seed.',

        },

      },

      update: {

        ...devAuth,

        firstName: account.firstName,

        lastName: account.lastName,

        deletedAt: null,

      },

    });



    await prisma.userRole.upsert({

      where: {

        userId_roleId_tenantId: {

          userId: user.id,

          roleId,

          tenantId: params.tenantId,

        },

      },

      create: { userId: user.id, roleId, tenantId: params.tenantId },

      update: {},

    });



    if (account.roleKey === 'admin') {

      await prisma.learnerProfile.upsert({

        where: { userId: user.id },

        create: {

          userId: user.id,

          tenantId: params.tenantId,

          jurisdictionId: params.jurisdictionId,

          professionId: params.professionId,

          onboardingComplete: false,

          profileData: { seeded: true },

        },

        update: {

          jurisdictionId: params.jurisdictionId,

          professionId: params.professionId,

        },

      });

    }

  }



  if (passwordHash) {

    await prisma.user.updateMany({

      where: {

        tenantId: params.tenantId,

        email: { in: [DEV_SEED_ADMIN_EMAIL, DEV_SEED_INSTRUCTOR_EMAIL] },

      },

      data: {

        passwordHash,

        emailVerifiedAt: new Date(),

        status: UserStatus.ACTIVE,

        failedLoginCount: 0,

        lockedUntil: null,

        deletedAt: null,

      },

    });



    for (const email of [DEV_SEED_ADMIN_EMAIL, DEV_SEED_INSTRUCTOR_EMAIL]) {

      const staff = await prisma.user.findFirst({

        where: { tenantId: params.tenantId, email },

        select: { passwordHash: true },

      });

      if (!staff?.passwordHash) {

        throw new Error(`seedDevStaffUsers: passwordHash missing for ${email}`);

      }

      const valid = await bcrypt.compare(DEV_SEED_STAFF_PASSWORD, staff.passwordHash);

      if (!valid) {

        throw new Error(

          `seedDevStaffUsers: passwordHash for ${email} does not match SuccesS8@8`,

        );

      }

    }

  }

}


