/**
 * Create a password-reset token and send the email using the current process env.
 *
 * With Railway CLI (uses production SMTP from this machine, which can reach Gmail):
 *   RESET_TO=learner@example.com railway run -- pnpm --filter @calace/api exec ts-node scripts/send-password-reset.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AuthTokenType, NotificationStatus } from '@calace/db';
import { ConfigService } from '@nestjs/config';

import { generateSecureToken, hashToken } from '../src/common/crypto.util';
import { EmailDeliveryService } from '../src/email/email-delivery.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key]) continue;
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

for (const envPath of [
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../.env.local'),
]) {
  loadEnvFile(envPath);
}

async function main() {
  const email = (process.env.RESET_TO ?? process.argv[2] ?? '').trim().toLowerCase();
  if (!email) {
    console.error('Set RESET_TO to the learner email.');
    process.exit(1);
  }

  const config = new ConfigService();
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, tenantId: true, email: true, firstName: true },
    });
    if (!user?.email) {
      console.error(`No active user found for ${email}`);
      process.exit(1);
    }

    const raw = generateSecureToken(32);
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.PASSWORD_RESET,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const webUrl = (config.get<string>('WEB_URL') ?? 'https://onlineceunits.com').replace(/\/$/, '');
    const resetUrl = `${webUrl}/reset-password?token=${encodeURIComponent(raw)}`;

    const emailDelivery = new EmailDeliveryService(config);
    const notifications = new NotificationsService(prisma, emailDelivery, config);
    const notification = await notifications.sendPasswordResetEmail(
      user.tenantId,
      user.id,
      user.email,
      resetUrl,
      user.firstName ?? undefined,
    );

    if (notification.status === NotificationStatus.SENT) {
      console.log(`Password reset email sent to ${user.email} (expires in 1 hour).`);
      return;
    }

    console.error(`Email was not delivered (status=${notification.status}).`);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(99);
});
