/**
 * One-off: re-send the certificate-ready email for an existing certificate.
 *
 * Does NOT redo a course or change certificate data. It looks up the certificate by
 * number, builds the verify URL (same path the QR uses), and calls the exact production
 * method NotificationsService.sendCertificateReadyEmail. In dev (no SMTP), the email body
 * is logged to the API console; the audit Notification row is created as in production.
 *
 * Usage:
 *   pnpm --filter @calace/api exec ts-node scripts/resend-certificate-email.ts
 *   CERT_NO=CALACE-2026-7BKPSA pnpm --filter @calace/api exec ts-node scripts/resend-certificate-email.ts
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

// Load env the same way the other apps/api scripts do: repo-root .env first, then
// apps/api/.env (apps/api wins for anything it overrides).
for (const envPath of [
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../.env'),
]) {
  loadEnvFile(envPath);
}

import { ConfigService } from '@nestjs/config';

import type { CertificatePayload } from '../src/credentials/certificate.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailDeliveryService } from '../src/email/email-delivery.service';
import { NotificationsService } from '../src/notifications/notifications.service';

const CERT_NO = process.env.CERT_NO ?? 'CALACE-2026-7BKPSA';

async function main() {
  const config = new ConfigService();
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateNo: CERT_NO },
      include: {
        user: { select: { id: true, tenantId: true, email: true, firstName: true } },
        verificationToken: { select: { token: true, status: true } },
        completion: {
          select: {
            ceHoursEarned: true,
            courseVersion: {
              select: {
                ceHours: true,
                course: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!cert) {
      console.error(`Certificate not found: ${CERT_NO}`);
      process.exit(1);
    }
    if (!cert.user?.email) {
      console.error(`Certificate ${CERT_NO} has no user email.`);
      process.exit(1);
    }
    if (!cert.verificationToken?.token) {
      console.error(`Certificate ${CERT_NO} has no verification token.`);
      process.exit(1);
    }

    const payload = (cert.payload ?? {}) as Partial<CertificatePayload>;
    const courseTitle =
      payload.courseTitle ??
      cert.completion?.courseVersion?.course?.title ??
      'your course';
    const ceuHours = Number(
      payload.onlineCeuHours ??
        payload.ceuHours ??
        cert.completion?.ceHoursEarned ??
        cert.completion?.courseVersion?.ceHours ??
        1,
    );

    const webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
    const verifyUrl = `${webUrl.replace(/\/$/, '')}/verify-certificate/token/${encodeURIComponent(cert.verificationToken.token)}`;

    const emailDelivery = new EmailDeliveryService(config);
    const notifications = new NotificationsService(prisma, emailDelivery, config);

    console.log('Re-sending certificate-ready email…');
    console.log(`  Certificate: ${cert.certificateNo}`);
    console.log(`  To:          ${cert.user.email}`);
    console.log(`  Course:      ${courseTitle}`);
    console.log(`  CE hours:    ${ceuHours}`);
    console.log(`  Verify URL:  ${verifyUrl}`);

    await notifications.sendCertificateReadyEmail({
      tenantId: cert.user.tenantId,
      userId: cert.user.id,
      to: cert.user.email,
      firstName: cert.user.firstName ?? undefined,
      courseTitle,
      certificateNo: cert.certificateNo,
      ceuHours,
      verifyUrl,
    });

    console.log('Done. Check the console above for the [email] certificate_ready output (dev) or your inbox (SMTP configured).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Resend failed:', error);
  process.exit(1);
});
