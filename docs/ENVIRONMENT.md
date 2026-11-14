# Environment Variable Strategy

This document defines how configuration is managed across the CAL ACE LMS monorepo.

## Principles

1. **Never commit secrets** — `.env`, `.env.local`, and environment-specific files are gitignored. Only `.env.example` templates are committed.
2. **Single source at the root** — Shared variables (database, API URLs) live in the repository root `.env`.
3. **App-specific overrides** — Apps may define local `.env.local` for values that differ per developer or deployment target.
4. **Public vs private** — Next.js only exposes variables prefixed with `NEXT_PUBLIC_` to the browser. All other web variables stay server-side.

## Loading order

### Root (shared)

| File           | Purpose                                      |
| -------------- | -------------------------------------------- |
| `.env`         | Default local development values             |
| `.env.local`   | Developer-specific overrides (gitignored)    |

### `@calace/api` (NestJS)

`ConfigModule` loads, in order (first match wins per Nest rules):

1. `apps/api/.env.local`
2. `apps/api/.env`
3. `../../.env.local` (monorepo root)
4. `../../.env` (monorepo root)

### `@calace/web` (Next.js)

Next.js automatically loads from `apps/web/`:

1. `.env.local`
2. `.env`

For shared variables, duplicate required keys in `apps/web/.env.local` or symlink — **recommended**: copy `NEXT_PUBLIC_*` and server keys from root `.env` into `apps/web/.env.local` during setup, or use a single root `.env` and document which keys each app needs.

### `@calace/db` (Prisma CLI)

Prisma reads `DATABASE_URL` and `DIRECT_URL` from:

1. `packages/db/.env` (optional)
2. Shell environment
3. Root `.env` when commands are run from root via `pnpm db:*` scripts

**Recommendation:** Run Prisma commands from the repo root after copying `.env.example` to `.env`.

## External brand URLs

Learner UI links to **CNA Network** (not `cna.online`). Constants live in `apps/web/lib/cna-network.ts`:

| Purpose | URL |
| ------- | --- |
| Main site | `https://www.cna.network` |
| Renewal / community hub | `https://www.cna.network/renewal` |

These are hard-coded public URLs; they are not driven by environment variables and do not affect app routing.

## Variable reference

| Variable               | Scope        | Used by                    |
| ---------------------- | ------------ | -------------------------- |
| `DATABASE_URL`         | Secret       | Prisma, API                |
| `DIRECT_URL`           | Secret       | Prisma (migrations)        |
| `API_PORT`             | Server       | API                        |
| `API_CORS_ORIGIN`      | Server       | API CORS                   |
| `WEB_URL`              | Server       | API (links, redirects)     |
| `SMTP_HOST`            | Secret       | API transactional email    |
| `SMTP_PORT`            | Server       | API transactional email    |
| `SMTP_USER`            | Secret       | API transactional email    |
| `SMTP_PASSWORD`        | Secret       | API transactional email    |
| `SMTP_FROM`            | Server       | API sender (default support@cna.school) |
| `SMTP_SECURE`          | Server       | API TLS (optional, port 465) |
| `SEED_DEV_PASSWORDS`   | Secret (dev) | @calace/db seed (writes dev passwords) |
| `NEXT_PUBLIC_API_URL`  | **Public**   | Web (browser API client)   |
| `NEXT_PUBLIC_APP_URL`  | **Public**   | Web (canonical app URL)    |
| `POSTGRES_*`           | Infra        | Docker Compose only        |

## Environments

| Environment | Config source                    |
| ----------- | -------------------------------- |
| Local       | `.env` + Docker Compose          |
| CI          | Pipeline secrets / env injection |
| Staging     | Platform env (e.g. Vercel, ECS)  |
| Production  | Secret manager / platform env      |

## Turbo

`turbo.json` declares `globalEnv` keys so cached tasks invalidate when shared configuration changes.

## Seeding & dev credentials

The database seed (`pnpm --filter @calace/db db:seed`) writes foundation data: tenant, roles, staff accounts, demo learner, base courses. Whether it also writes known development passwords is gated by an explicit, fail-closed flag.

### SEED_DEV_PASSWORDS

Dev passwords (the shared staff/demo login password) are written only when `SEED_DEV_PASSWORDS` is exactly the string `true`. There is deliberately no `NODE_ENV` fallback — an unset or misconfigured environment fails closed (no dev passwords written), so the known dev password can never reach a remote/production database by accident.

For local development you must set this before seeding, or dev login will silently not work:

```env
# packages/db/.env  (gitignored — your local dev config)
SEED_DEV_PASSWORDS=true
```

⚠️ **Never set `SEED_DEV_PASSWORDS=true` in any production environment.** Doing so would write a publicly-known password as a valid login.

This flag belongs in `packages/db/.env` specifically, because that is the env the `@calace/db` seed scripts load (see the `@calace/db` loading-order section above). Setting it only in the root `.env` is not guaranteed to reach the seed.

### Dev login accounts (after seeding with the flag set)

| Account | Role | Password |
| ------- | ---- | -------- |
| support@cna.school | admin | SuccesS8@8 |
| instructor@cna.school | instructor | SuccesS8@8 |
| jane.doe@example.com | learner | SuccesS8@8 |

These exist only on the development database. They are not present (and must never be created) in production.

## ⚠️ Database migrations — drift warning (read before running migrations)

The shared Neon development database currently has migration drift — its live schema does not match the committed migration history. As a result:

- **Do NOT run `pnpm db:migrate` (`prisma migrate dev`) against the dev database until the drift is healed.** On a drifted database, `migrate dev` will detect the mismatch and offer to reset the database — which destroys all seeded data (courses, enrollments, certificates). If you ever see a prompt mentioning "drift detected", "reset", or "data loss", answer **No** and stop.

Known drift (present in the DB, missing from migration history) as of this writing:

- **notifications table:** an index on `(user_id, channel)` that is not in any migration
- **users table:** a `terms_accepted_at` column not in any migration
- **migration `20260605120000_enrollment_attempts_used`** was modified after it was applied

Healing this drift is a tracked, pre-launch task (the migration history must be clean before the first production `prisma migrate deploy`). Until it is healed, treat schema changes as blocked — do not add migrations on top of the drift.

If you only need a schema change applied to your own throwaway local Postgres (not the shared Neon dev DB), `pnpm db:push` applies the schema without touching migration history — but **never use it against the shared dev DB**, as it adds further drift.
