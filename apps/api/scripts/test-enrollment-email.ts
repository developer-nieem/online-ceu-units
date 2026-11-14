/**
 * One-off: send a TEST enrollment-confirmed email for an existing enrollment.
 *
 * Mirrors resend-certificate-email.ts. Looks up one real enrollment (default: Jane Doe),
 * builds the course URL, and calls the production method
 * NotificationsService.sendEnrollmentConfirmedEmail. In dev (no SMTP) the email body is
 * logged to the API console; a Notification row is created as in production.
 *
 * IMPORTANT: This script loads ONLY the repo-root .env (Neon), NOT apps/api/.env
 * (which points at localhost:5432 and has no DB running). That is intentional so the
 * lookup hits the production Neon database where the seeded data lives.
 *
 * Usage:
 *   pnpm --filter @calace/api exec ts-node scripts/test-enrollment-email.ts
 *   ENROLLMENT_ID=... pnpm --filter @calace/api exec ts-node scripts/test-enrollment-email.ts
 *   LEARNER_EMAIL=jane.doe@example.com pnpm --filter @calace/api exec ts-node scripts/test-enrollment-email.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.length > 0) process.env[key] = value;
  }
}

// Load ONLY the repo-root .env (Neon). Deliberately skip apps/api/.env (localhost).
loadEnvFile(resolve(__dirname, '../../../.env'));

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../src/prisma/prisma.service';
import { EmailDeliveryService } from '../src/email/email-delivery.service';
import { NotificationsService } from '../src/notifications/notifications.service';

const ENROLLMENT_ID = process.env.ENROLLMENT_ID;
const LEARNER_EMAIL = process.env.LEARNER_EMAIL ?? 'jane.doe@example.com';

async function main() {
  const config = new ConfigService();
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const include = {
      user: { select: { id: true, tenantId: true, email: true, firstName: true } },
      courseVersion: {
        select: { course: { select: { title: true, slug: true } } },
      },
    } as const;

    const enrollment = ENROLLMENT_ID
      ? await prisma.enrollment.findUnique({ where: { id: ENROLLMENT_ID }, include })
      : await prisma.enrollment.findFirst({
          where: { deletedAt: null, user: { email: LEARNER_EMAIL } },
          include,
        });

    if (!enrollment) {
      console.error(
        `No enrollment found${ENROLLMENT_ID ? ` for id ${ENROLLMENT_ID}` : ` for ${LEARNER_EMAIL}`}.`,
      );
      process.exit(1);
    }
    if (!enrollment.user?.email) {
      console.error('Enrollment has no user email.');
      process.exit(1);
    }

    const courseTitle = enrollment.courseVersion?.course?.title ?? 'your course';
    const courseSlug = enrollment.courseVersion?.course?.slug ?? '';
    const webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
    const courseUrl = `${webUrl.replace(/\/$/, '')}/courses/${courseSlug}`;

    const emailDelivery = new EmailDeliveryService(config);
    const notifications = new NotificationsService(prisma, emailDelivery, config);

    console.log('Sending TEST enrollment-confirmed email…');
    console.log(`  Enrollment:  ${enrollment.id}`);
    console.log(`  To:          ${enrollment.user.email}`);
    console.log(`  Course:      ${courseTitle}`);
    console.log(`  Course URL:  ${courseUrl}`);

    await notifications.sendEnrollmentConfirmedEmail({
      tenantId: enrollment.user.tenantId,
      userId: enrollment.user.id,
      to: enrollment.user.email,
      firstName: enrollment.user.firstName ?? undefined,
      courseTitle,
      courseUrl,
    });

    console.log('Done. Check the console above for the [email] enrollment_confirmed output (dev) or your inbox (SMTP configured).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
