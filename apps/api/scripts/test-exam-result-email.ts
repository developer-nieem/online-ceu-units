/**
 * One-off: send a TEST final-exam-result email (pass or fail variant) for a learner.
 *
 * Mirrors resend-certificate-email.ts. Looks up a user (default: Jane Doe) + one of their
 * courses, then calls the production method NotificationsService.sendFinalExamResultEmail.
 * Toggle pass/fail and score with env vars to preview BOTH variants.
 *
 * IMPORTANT: Loads ONLY the repo-root .env (Neon), NOT apps/api/.env (localhost).
 *
 * Usage:
 *   # Pass variant (default), score 85
 *   pnpm --filter @calace/api exec ts-node scripts/test-exam-result-email.ts
 *
 *   # Fail variant, score 62  (PowerShell)
 *   $env:PASSED="false"; $env:SCORE_PCT="62"; pnpm --filter @calace/api exec ts-node scripts/test-exam-result-email.ts
 *
 *   # No score shown
 *   $env:SCORE_PCT="none"; pnpm --filter @calace/api exec ts-node scripts/test-exam-result-email.ts
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

const LEARNER_EMAIL = process.env.LEARNER_EMAIL ?? 'jane.doe@example.com';
const PASSED = process.env.PASSED !== 'false'; // default: pass
const SCORE_RAW = process.env.SCORE_PCT ?? '85';

async function main() {
  const config = new ConfigService();
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const user = await prisma.user.findFirst({
      where: { email: LEARNER_EMAIL, deletedAt: null },
      select: { id: true, tenantId: true, email: true, firstName: true },
    });

    if (!user?.email) {
      console.error(`No user found for ${LEARNER_EMAIL}.`);
      process.exit(1);
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id, deletedAt: null },
      include: {
        courseVersion: {
          select: { course: { select: { title: true, slug: true } } },
        },
      },
    });

    if (!enrollment) {
      console.error(`No enrollment found for ${LEARNER_EMAIL} (need a course for the email).`);
      process.exit(1);
    }

    const courseTitle = enrollment.courseVersion?.course?.title ?? 'your course';
    const courseSlug = enrollment.courseVersion?.course?.slug ?? '';
    const webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
    const courseUrl = `${webUrl.replace(/\/$/, '')}/courses/${courseSlug}`;

    // SCORE_PCT="none" => omit score; otherwise numeric
    const scorePct =
      SCORE_RAW.toLowerCase() === 'none' ? undefined : Number(SCORE_RAW);

    const emailDelivery = new EmailDeliveryService(config);
    const notifications = new NotificationsService(prisma, emailDelivery, config);

    console.log('Sending TEST exam-result email…');
    console.log(`  To:        ${user.email}`);
    console.log(`  Course:    ${courseTitle}`);
    console.log(`  Variant:   ${PASSED ? 'PASSED' : 'NOT PASSED'}`);
    console.log(`  Score:     ${scorePct ?? '(none)'}`);
    console.log(`  Course URL:${courseUrl}`);

    await notifications.sendFinalExamResultEmail({
      tenantId: user.tenantId,
      userId: user.id,
      to: user.email,
      firstName: user.firstName ?? undefined,
      courseTitle,
      passed: PASSED,
      scorePct,
      courseUrl,
    });

    console.log('Done. Check the console above for the [email] exam_result output (dev) or your inbox (SMTP configured).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
