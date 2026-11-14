/**
 * Unsubscribe end-to-end smoke test for staging.
 *
 * Mints a real signed unsubscribe token using the SAME secret resolution and
 * signing code the API uses (no drift), prints the links, and — if BASE_URL is
 * set — exercises the public endpoints (preview + one-click) against a running
 * API so you can confirm the full click-through without waiting for an email.
 *
 * Usage (from repo root), against a running staging API:
 *   JWT_ACCESS_SECRET=... \     # or UNSUBSCRIBE_SECRET=...
 *   WEB_URL=https://staging.onlineceunits.com \
 *   BASE_URL=https://staging-api.onlineceunits.com \   # API origin (optional)
 *   TENANT_ID=<tenantId> USER_ID=<userId> SCOPE=marketing \
 *   pnpm --filter @calace/api exec ts-node scripts/unsubscribe-smoke.ts
 *
 * SCOPE ∈ course-reminders | marketing | all
 *
 * After it runs with BASE_URL, verify the flip:
 *   GET /api/notifications/preferences  (as that user) → the matching flag is false
 *   Re-trigger the same email → it should be SKIPPED (no second send).
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { ConfigService } from '@nestjs/config';

import {
  buildOneClickUnsubscribeUrl,
  buildUnsubscribeUrl,
  isUnsubscribeScope,
  resolveUnsubscribeSecret,
  signUnsubscribeToken,
} from '../src/notifications/unsubscribe-token.util';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value && process.env[key] === undefined) process.env[key] = value;
  }
}

/** Minimal ConfigService shim so we reuse the server's secret resolution. */
const configShim = {
  get<T = string>(key: string, def?: T): T | undefined {
    const v = process.env[key];
    return (v ?? def) as T | undefined;
  },
} as unknown as ConfigService;

async function main() {
  loadEnvFile(resolve(process.cwd(), '.env'));
  loadEnvFile(resolve(process.cwd(), 'apps/api/.env.local'));

  const tenantId = process.env.TENANT_ID;
  const userId = process.env.USER_ID;
  const scope = process.env.SCOPE ?? 'marketing';
  const webUrl = (process.env.WEB_URL ?? 'https://onlineceunits.com').replace(/\/$/, '');
  const baseUrl = process.env.BASE_URL?.replace(/\/$/, '');

  if (!tenantId || !userId) {
    console.error('Missing TENANT_ID and/or USER_ID. See header for usage.');
    process.exit(1);
  }
  if (!isUnsubscribeScope(scope)) {
    console.error(`Invalid SCOPE "${scope}". Use: course-reminders | marketing | all`);
    process.exit(1);
  }
  if (!process.env.UNSUBSCRIBE_SECRET && !process.env.JWT_ACCESS_SECRET) {
    console.error('Set UNSUBSCRIBE_SECRET or JWT_ACCESS_SECRET (must match the API).');
    process.exit(1);
  }

  const secret = resolveUnsubscribeSecret(configShim);
  const token = signUnsubscribeToken(secret, { t: tenantId, u: userId, s: scope });

  console.log('\n=== Unsubscribe smoke test ===');
  console.log(`tenant=${tenantId} user=${userId} scope=${scope}`);
  console.log('\nConfirmation page (safe GET, click this in a browser):');
  console.log('  ' + buildUnsubscribeUrl(webUrl, token));
  console.log('\nOne-click (RFC 8058 POST target, used in List-Unsubscribe header):');
  console.log('  ' + buildOneClickUnsubscribeUrl(webUrl, token));

  if (!baseUrl) {
    console.log('\nBASE_URL not set — skipping live endpoint calls. Links above are valid.');
    return;
  }

  console.log(`\n--- Hitting API at ${baseUrl} ---`);
  const previewUrl = `${baseUrl}/api/notifications/unsubscribe/preview?token=${encodeURIComponent(token)}`;
  const previewRes = await fetch(previewUrl);
  console.log(`GET preview → ${previewRes.status}: ${await previewRes.text()}`);

  const oneClickUrl = `${baseUrl}/api/notifications/unsubscribe/one-click?token=${encodeURIComponent(token)}`;
  const oneClickRes = await fetch(oneClickUrl, { method: 'POST' });
  console.log(`POST one-click → ${oneClickRes.status}: ${await oneClickRes.text()}`);

  console.log(
    '\nNow confirm as that user: GET /api/notifications/preferences — the flag for ' +
      `scope "${scope}" should be false. Re-trigger the email → it should be skipped.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
