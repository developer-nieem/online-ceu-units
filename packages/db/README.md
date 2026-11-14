# @calace/db

Prisma schema, migrations, and database client for the CAL ACE CEU LMS.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `db:generate` | `prisma generate` | Regenerate Prisma Client |
| `db:migrate` | `prisma migrate dev` | Create/apply dev migrations |
| `db:migrate:deploy` | `prisma migrate deploy` | Apply migrations (CI/production) |
| `db:push` | `prisma db push` | Prototype schema without migration files |
| `db:studio` | `prisma studio` | Visual data browser |
| `db:seed` | `tsx prisma/seed.ts` | Load foundation seed data |

Run from the monorepo root via `pnpm db:*` or from this package via `pnpm <script>`.

## Environment

Requires `DATABASE_URL` and `DIRECT_URL` (see `.env.example`). Copy the root `.env` or `packages/db/.env` before running Prisma CLI.

## Schema

`prisma/schema.prisma` — multi-tenant CEU LMS models (tenancy, RBAC, courses, compliance, commerce, audit).
