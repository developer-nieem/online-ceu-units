# CAL ACE Nursing Academy — Online CEU LMS

Enterprise monorepo foundation for the CAL ACE Nursing Academy continuing education platform.

## Tech stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Monorepo   | Turborepo, pnpm workspaces          |
| Web        | Next.js 15, React 19, Tailwind CSS  |
| UI         | shadcn/ui (`@calace/ui`)            |
| API        | NestJS 11                           |
| Database   | PostgreSQL, Prisma (`@calace/db`)   |
| Tooling    | TypeScript, ESLint, Prettier        |

## Repository structure

```
renewal-cna-school/
├── apps/
│   ├── web/          # Next.js learner & admin frontend
│   └── api/          # NestJS REST API
├── packages/
│   ├── db/           # Prisma schema & client
│   ├── content-blocks/  # Lesson JSON schema v2 (learner + CMS)
│   ├── ui/           # Shared shadcn/ui design system
│   ├── typescript-config/
│   └── eslint-config/
├── docs/             # Product & architecture documentation
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Prerequisites

- **Node.js** ≥ 20.11 ([`.nvmrc`](.nvmrc))
- **pnpm** ≥ 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- **Docker** (for local PostgreSQL)

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
```

Align `apps/web/.env.local` and `apps/api/.env.local` with root `.env` values. See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Apply database migrations & seed

```bash
pnpm db:migrate
pnpm db:seed
```

`db:migrate` runs interactively on first apply (creates migration if needed). For CI/production use `pnpm db:migrate:deploy`.

### 5. Run development servers

```bash
pnpm dev
```

| Service | URL                                |
| ------- | ---------------------------------- |
| Web     | http://localhost:3000              |
| API     | http://localhost:3001/api          |
| Health  | http://localhost:3001/api/health   |
| CMS     | http://localhost:3000/cms (staff)  |
| Admin   | http://localhost:3000/admin (admin only) |

### Staff CMS (development)

After `pnpm db:seed`, log in at `/login` and open `/cms`:

| Account | Email | Password (dev only) |
|---------|--------|------------------------|
| Admin | `support@cna.school` | `SuccesS8@8` |
| Instructor | `instructor@cna.school` | `SuccesS8@8` |

See [docs/CMS.md](docs/CMS.md) for architecture, API routes, and publishing workflow.

### Admin operations dashboard

Admins only (`support@cna.school` after seed) can open `/admin` for learner/course monitoring, certificates, audit log, and revenue/support placeholders. Instructors do not have access.

See [docs/ADMIN.md](docs/ADMIN.md) and [docs/ADMIN_ANALYTICS.md](docs/ADMIN_ANALYTICS.md).

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Start web + API (builds workspace deps first) |
| `pnpm dev:packages`  | Watch-compile `@calace/db` / `@calace/ui` only |
| `pnpm build`         | Production build all packages        |
| `pnpm lint`          | ESLint across workspace              |
| `pnpm typecheck`     | TypeScript check                     |
| `pnpm format`        | Prettier write                       |
| `pnpm format:check`  | Prettier check (CI)                  |
| `pnpm db:generate`   | Generate Prisma client               |
| `pnpm db:migrate`    | Create & apply dev migrations        |
| `pnpm db:push`       | Push schema (prototyping only)       |
| `pnpm db:studio`     | Open Prisma Studio                   |
| `pnpm db:seed`       | Load foundation seed data            |

## Troubleshooting

### API: `Cannot find module .../dist/main`

Nest clears `apps/api/dist` on compile while TypeScript incremental cache can stay stale. Fix:

```bash
pnpm --filter @calace/api clean
pnpm --filter @calace/api build
pnpm --filter @calace/api dev
```

Build info is stored at `apps/api/dist/.tsbuildinfo` so it is cleared with `dist`.

### Fresh clone

```bash
pnpm install
pnpm db:generate
pnpm build
pnpm dev
```

## Adding shadcn/ui components

From `packages/ui`:

```bash
cd packages/ui
pnpm dlx shadcn@latest add <component>
```

Components are consumed in `apps/web` via `@calace/ui/components/...`.

## Package naming

All workspace packages use the `@calace` scope:

- `@calace/web` — Next.js application
- `@calace/api` — NestJS application
- `@calace/db` — Database layer
- `@calace/ui` — Shared UI primitives
- `@calace/typescript-config` — Shared TS configs
- `@calace/eslint-config` — Shared ESLint configs

## Documentation

- [Authentication](docs/AUTH.md)
- [Course authoring CMS](docs/CMS.md)
- [Admin operations dashboard](docs/ADMIN.md)
- [Content blocks](docs/CONTENT_BLOCKS.md)
- [Environment variables](docs/ENVIRONMENT.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Compliance](docs/COMPLIANCE_REQUIREMENTS.md)
- [Course engine](docs/COURSE_ENGINE.md)

## License

See [LICENSE](LICENSE).
