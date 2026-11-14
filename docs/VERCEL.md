# Deploy `@calace/web` to Vercel

> **Step-by-step for Vercel + Railway:** see [DEPLOY.md](./DEPLOY.md).

This monorepo ships a **Next.js 15** app (`apps/web`) and a **NestJS** API (`apps/api`).

| Piece | Host |
| ----- | ---- |
| Web (learner / CMS / admin UI) | **Vercel** (`calace@cna.school`) |
| API (NestJS) | **Railway** (GitHub-connected) |
| Database | Neon |

Vercel hosts the frontend. Nest stays a long-running Node server on Railway. The web app proxies browser calls to Nest via `INTERNAL_API_URL`.

## 1. Prerequisites

- GitHub repo connected (e.g. `CalAce-Dev/renewal-cna-school`)
- Nest API deployed somewhere with a public HTTPS URL (example: `https://api.your-domain.com`)
- Neon `DATABASE_URL` / `DIRECT_URL` for the API (not required on Vercel unless you add server routes that use Prisma directly)

## 2. Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → Import the GitHub repo.
2. **Root Directory:** `apps/web` (Important for this monorepo).
3. Framework: Next.js (auto-detected via `apps/web/vercel.json`).
4. Enable **Include source files outside of the Root Directory** (Settings → General) so workspace packages under `packages/` are available at build time.
5. Install / Build commands are already in `apps/web/vercel.json`.
6. Production branch: `main` (or `Nieem` while iterating).

## 3. Environment variables (Vercel → Settings → Environment Variables)

Set these for **Production** (and Preview if needed):

| Variable | Example | Notes |
| -------- | ------- | ----- |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Canonical site URL |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com` | Public API origin (no trailing slash) |
| `INTERNAL_API_URL` | `https://api.your-domain.com` | Server-side proxy target (same origin as Nest) |
| `NEXT_PUBLIC_CAPTCHA_PROVIDER` | `none` | Or `turnstile` / `recaptcha` in prod |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` / `pk_test_…` | Optional until billing goes live |
| `STRIPE_SECRET_KEY` | `sk_…` | Only if web server routes need Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Only if webhook handled on web |

Do **not** put Nest secrets (`JWT_ACCESS_SECRET`, `DATABASE_URL`, SMTP, etc.) on Vercel — those belong on the API host.

## 4. Nest API host (required for a working site)

On Railway / Render / Fly, deploy `apps/api` with at least:

- `DATABASE_URL`, `DIRECT_URL`
- `JWT_ACCESS_SECRET` (long random secret — not the local default)
- `API_CORS_ORIGIN` = your Vercel URL (e.g. `https://your-app.vercel.app`)
- `WEB_URL` = same Vercel URL
- `CAPTCHA_PROVIDER`, SMTP, Stripe as needed

After the API is live, point Vercel’s `INTERNAL_API_URL` / `NEXT_PUBLIC_API_URL` at it and redeploy the web app.

## 5. Local check before first deploy

```bash
pnpm install
pnpm turbo run build --filter=@calace/web
```

## 6. Common failures

| Symptom | Fix |
| ------- | --- |
| Build can’t find `@calace/ui` / workspace packages | Root Directory must be `apps/web` and “include files outside root” must be on |
| Site loads but login / catalog 503 | API URL wrong or Nest not reachable — check `INTERNAL_API_URL` |
| Cookies / auth fail across domains | Ensure API `API_CORS_ORIGIN` matches the Vercel origin; cookie Domain settings on Nest |
| Turbo binary issues on Windows only | Vercel builds on Linux — local Windows turbo issues do not apply there |
