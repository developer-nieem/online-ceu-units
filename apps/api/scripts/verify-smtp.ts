/**
 * SMTP connectivity check for local/staging diagnostics.
 * Usage: pnpm --filter @calace/api exec ts-node scripts/verify-smtp.ts
 * Optional: SMTP_TEST_TO=you@example.com to send a single test message.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import * as nodemailer from 'nodemailer';

import {
  classifySmtpError,
  diagnoseSmtpEnv,
  formatSafeSmtpStatus,
  formatSmtpErrorLog,
  gmailAuthFailureHint,
} from '../src/email/smtp-error.util';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.length > 0) {
      process.env[key] = value;
    }
  }
}

/** Match Nest ConfigModule precedence: later paths override earlier (api .env.local wins). */
const repoRoot = resolve(__dirname, '../../..');
for (const file of [
  resolve(repoRoot, '.env'),
  resolve(repoRoot, '.env.local'),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../.env.local'),
]) {
  loadEnvFile(file);
}

function env(key: string): string | undefined {
  return process.env[key]?.trim();
}

async function main() {
  const diagnostic = diagnoseSmtpEnv(env);
  const from =
    env('SMTP_FROM') || `Online CE Units - CAL ACE <support@onlineceunits.com>`;

  console.log('--- SMTP environment ---');
  console.log(`configured: ${diagnostic.configured}`);
  if (diagnostic.missing.length) {
    console.log(`missing: ${diagnostic.missing.join(', ')}`);
  }
  console.log(`host: ${diagnostic.host ?? '(unset)'}`);
  console.log(`port: ${diagnostic.port ?? 587}`);
  console.log(`user: ${diagnostic.user ?? '(unset)'}`);
  console.log(`password: ${env('SMTP_PASSWORD') ? '(set)' : '(unset)'}`);
  console.log(`from: ${from}`);
  console.log(`secure: ${diagnostic.secure}`);

  if (!diagnostic.configured) {
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host: diagnostic.host,
    port: diagnostic.port,
    secure: diagnostic.secure,
    requireTLS: !diagnostic.secure && diagnostic.port === 587,
    auth: {
      user: diagnostic.user,
      pass: env('SMTP_PASSWORD'),
    },
  });

  console.log('\n--- SMTP verify (connection + auth) ---');
  try {
    await transport.verify();
    console.log('OK: SMTP connection and authentication succeeded.');
  } catch (err) {
    const classified = classifySmtpError(err);
    console.error(`SMTP send failed: ${classified.message}`);
    console.error(formatSmtpErrorLog(classified.category, classified.message, classified.hint));
    const gmailHint = gmailAuthFailureHint(classified.category);
    if (gmailHint) console.error(gmailHint);
    process.exit(2);
  }

  const testTo = env('SMTP_TEST_TO');
  if (testTo) {
    console.log(`\n--- Sending test email to ${testTo} ---`);
    try {
      const result = await transport.sendMail({
        from,
        to: testTo,
        replyTo: 'support@onlineceunits.com',
        subject: 'CAL ACE SMTP test',
        text: 'SMTP test from verify-smtp.ts',
        html: '<p>SMTP test from <strong>verify-smtp.ts</strong></p>',
      });
      console.log(`OK: test message sent (messageId=${result.messageId ?? 'n/a'})`);
    } catch (err) {
      const classified = classifySmtpError(err);
      console.error(formatSmtpErrorLog(classified.category, classified.message, classified.hint));
      process.exit(3);
    }
  } else {
    console.log('\n(Set SMTP_TEST_TO to send a test message.)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(99);
});
