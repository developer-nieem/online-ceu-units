/**
 * prisma generate for CI/Vercel — does not need a real database.
 * Schema requires DATABASE_URL + DIRECT_URL env vars; placeholders are enough.
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DUMMY_DB =
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public';

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = DUMMY_DB;
}
if (!process.env.DIRECT_URL?.trim()) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

execSync('prisma generate', {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
