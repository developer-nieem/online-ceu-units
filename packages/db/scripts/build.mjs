import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(root, 'prisma', 'schema.prisma');
const hashPath = join(root, '.prisma-schema-hash');

/** Dummy URLs so `prisma generate` works on Vercel/CI without real DB secrets. */
const DUMMY_DB =
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public';

function ensureGenerateEnv() {
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = DUMMY_DB;
  }
  if (!process.env.DIRECT_URL?.trim()) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}

function schemaHash() {
  return createHash('sha256').update(readFileSync(schemaPath)).digest('hex');
}

function shouldGenerate() {
  if (process.env.PRISMA_GENERATE_FORCE === '1') return true;
  if (process.env.SKIP_PRISMA_GENERATE === '1') return false;
  if (!existsSync(hashPath)) return true;
  return readFileSync(hashPath, 'utf8').trim() !== schemaHash();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runPrismaGenerate() {
  ensureGenerateEnv();
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      execSync('prisma generate', {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
      });
      writeFileSync(hashPath, schemaHash(), 'utf8');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isLastAttempt = attempt === maxAttempts;
      const looksLikeLock =
        /EPERM|EBUSY|operation not permitted|being used by another process/i.test(message);

      if (!isLastAttempt && looksLikeLock) {
        console.warn(
          `[@calace/db] prisma generate locked (attempt ${attempt}/${maxAttempts}); retrying…`,
        );
        sleep(1500 * attempt);
        continue;
      }

      if (looksLikeLock && existsSync(hashPath)) {
        console.warn(
          '[@calace/db] prisma generate skipped — Prisma engine is locked but client was generated previously.',
        );
        return;
      }

      throw error;
    }
  }
}

if (shouldGenerate()) {
  runPrismaGenerate();
} else {
  console.log('[@calace/db] Prisma client up to date — skipping generate.');
}

execSync('tsc', { cwd: root, stdio: 'inherit' });
