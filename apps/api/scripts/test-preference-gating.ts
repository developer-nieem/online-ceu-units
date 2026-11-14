/**
 * One-off TEST: proves notification preference-gating works end-to-end.
 *
 * Asserts that sendCertificateReadyEmail:
 *   - is SKIPPED when emailEnabled = false               (opt-out master switch)
 *   - is SKIPPED when certificateNotificationsEnabled = false (category switch)
 *   - is SENT (not pref-skipped) when both are true       (default / opt-in)
 *
 * A skip is identified by payload.skippedDueToPreferences === true + sentAt === null.
 * (Status alone is unreliable: dev-mode no-SMTP also yields PENDING — see report.)
 *
 * Safe: snapshots the user's original metadata and RESTORES it in finally, so the
 * user is left exactly as found. Loads ONLY repo-root .env (Neon), not apps/api/.env.
 *
 * Usage:
 *   pnpm --filter @calace/api exec ts-node scripts/test-preference-gating.ts
 *   LEARNER_EMAIL=jane.doe@example.com pnpm --filter @calace/api exec ts-node scripts/test-preference-gating.ts
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

let passCount = 0;
let failCount = 0;

function assert(label: string, condition: boolean) {
  if (condition) {
    passCount += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failCount += 1;
    console.log(`  FAIL  ${label}`);
  }
}

type NotificationRow = {
  status: string;
  sentAt: Date | null;
  payload: unknown;
};

function payloadFlag(row: NotificationRow, key: string): unknown {
  const p = (row.payload ?? {}) as Record<string, unknown>;
  return p[key];
}

async function main() {
  const config = new ConfigService();
  const prisma = new PrismaService();
  await prisma.$connect();

  // Build the service stack (same manual construction as the other scripts).
  const emailDelivery = new EmailDeliveryService(config);
  const notifications = new NotificationsService(prisma, emailDelivery, config);

  // Look up the user.
  const user = await prisma.user.findFirst({
    where: { email: LEARNER_EMAIL, deletedAt: null },
    select: { id: true, tenantId: true, email: true, firstName: true, metadata: true },
  });

  if (!user) {
    console.error(`No user found for ${LEARNER_EMAIL}.`);
    process.exit(1);
  }

  // Snapshot original metadata for guaranteed restore.
  const originalMetadata = user.metadata;
  console.log(`Testing preference-gating for: ${user.email}`);
  console.log('Original metadata snapshot taken (will restore at end).\n');

  // Helper to set notificationPreferences while preserving other metadata keys.
  const setPrefs = async (prefs: Record<string, boolean>) => {
    const meta = (originalMetadata ?? {}) as Record<string, unknown>;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...meta,
          notificationPreferences: {
            inAppEnabled: true,
            emailEnabled: true,
            courseRemindersEnabled: true,
            certificateNotificationsEnabled: true,
            marketingEmailsEnabled: false,
            ...prefs, // overrides
          },
        } as any,
      },
    });
  };

  const certParams = {
    tenantId: user.tenantId,
    userId: user.id,
    to: user.email,
    firstName: user.firstName ?? undefined,
    courseTitle: 'Preference Gating Test Course',
    certificateNo: 'CALACE-TEST-PREFGATE',
    ceuHours: 1,
    verifyUrl: 'http://localhost:3000/verify-certificate/token/test',
  };

  try {
    // ---- CASE 1: emailEnabled = false → expect SKIP ----
    console.log('CASE 1 — emailEnabled = false  → expect SKIP');
    await setPrefs({ emailEnabled: false });
    const row1 = (await notifications.sendCertificateReadyEmail(certParams)) as NotificationRow;
    assert('skippedDueToPreferences === true', payloadFlag(row1, 'skippedDueToPreferences') === true);
    assert("skippedPreferenceKey === 'emailEnabled'", payloadFlag(row1, 'skippedPreferenceKey') === 'emailEnabled');
    assert('sentAt === null', row1.sentAt === null);
    assert('no deliveryMode in payload (was not sent)', payloadFlag(row1, 'deliveryMode') === undefined);
    console.log('');

    // ---- CASE 2: certificateNotificationsEnabled = false (email on) → expect SKIP ----
    console.log('CASE 2 — emailEnabled = true, certificateNotificationsEnabled = false  → expect SKIP');
    await setPrefs({ emailEnabled: true, certificateNotificationsEnabled: false });
    const row2 = (await notifications.sendCertificateReadyEmail(certParams)) as NotificationRow;
    assert('skippedDueToPreferences === true', payloadFlag(row2, 'skippedDueToPreferences') === true);
    assert(
      "skippedPreferenceKey === 'certificateNotificationsEnabled'",
      payloadFlag(row2, 'skippedPreferenceKey') === 'certificateNotificationsEnabled',
    );
    assert('sentAt === null', row2.sentAt === null);
    console.log('');

    // ---- CASE 3: both true → expect SENT (NOT pref-skipped) ----
    console.log('CASE 3 — emailEnabled = true, certificateNotificationsEnabled = true  → expect SENT (not pref-skipped)');
    await setPrefs({ emailEnabled: true, certificateNotificationsEnabled: true });
    const row3 = (await notifications.sendCertificateReadyEmail(certParams)) as NotificationRow;
    assert(
      'skippedDueToPreferences is NOT true (went to send path)',
      payloadFlag(row3, 'skippedDueToPreferences') !== true,
    );
    console.log('  (Note: in dev with no SMTP this still logs an [email] line + PENDING row — that is delivery attempt, not a pref skip.)');
    console.log('');
  } finally {
    // ---- RESTORE original metadata exactly ----
    await prisma.user.update({
      where: { id: user.id },
      data: { metadata: (originalMetadata ?? {}) as any },
    });
    console.log('Original metadata restored.\n');
    await prisma.$disconnect();
  }

  console.log(`RESULT: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
