# Authentication

CAL ACE LMS uses NestJS JWT auth with HTTP-only cookies, refresh token rotation, RBAC, and CSRF protection for browser clients.

## Development seed credentials

Local `pnpm db:seed` only (`NODE_ENV !== 'production'`):

| Email | Password | Role |
|-------|----------|------|
| `support@cna.school` | `SuccesS8@8` | `admin` |
| `instructor@cna.school` | `SuccesS8@8` | `instructor` |

Re-running seed migrates legacy dev staff logins (`admin@renewal.cna.school`, `instructor@renewal.cna.school`) to the canonical emails above, or deactivates duplicates if both exist.

**Never use these credentials in production.** See `docs/CMS.md` for CMS access.

## Roles

| Slug | Purpose |
|------|---------|
| `learner` | Default signup role — CEU students |
| `admin` | Tenant administration |
| `instructor` | Course authoring (seeded, assign via DB/admin tooling) |
| `support` | Support staff (seeded, assign via DB/admin tooling) |

## Environment variables

### API (`apps/api` / root `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_ACCESS_SECRET` | Yes | Min 32 chars — access token signing secret |
| `JWT_REFRESH_SECRET` | No | Optional separate refresh secret (uses access if omitted) |
| `JWT_ACCESS_EXPIRES_IN` | No | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default `7d` |
| `DEFAULT_TENANT_SLUG` | No | Default `cal-ace` |
| `WEB_URL` | Yes | Frontend URL for email links |
| `API_CORS_ORIGIN` | Yes | Must match web origin (`http://localhost:3000`) |
| `CAPTCHA_PROVIDER` | Prod | `turnstile`, `recaptcha`, or `none` (dev only) |
| `TURNSTILE_SECRET_KEY` | If Turnstile | Server-side Turnstile secret |
| `RECAPTCHA_SECRET_KEY` | If reCAPTCHA | Server-side reCAPTCHA secret |

### Web (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API base URL (`http://localhost:3001`) |
| `NEXT_PUBLIC_APP_URL` | No | Canonical app URL |
| `NEXT_PUBLIC_CAPTCHA_PROVIDER` | Prod | `turnstile`, `recaptcha`, or `none` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | If Turnstile | Turnstile site key |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | If reCAPTCHA | reCAPTCHA site key |

### Generate secrets (development)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/csrf` | Public | Issue CSRF cookie |
| POST | `/api/auth/signup` | Public + CSRF | Register learner |
| POST | `/api/auth/login` | Public + CSRF | Sign in |
| POST | `/api/auth/logout` | Public + CSRF | Revoke session |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate tokens |
| GET | `/api/auth/me` | JWT | Current session |
| POST | `/api/auth/forgot-password` | Public + CSRF | Request reset |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| POST | `/api/auth/verify-email` | Public | Verify email token |
| POST | `/api/auth/resend-verification` | JWT | Resend verification |

## Cookies

| Cookie | HttpOnly | Purpose |
|--------|----------|---------|
| `calace_access` | Yes | Short-lived JWT |
| `calace_refresh` | Yes | Refresh token (path `/api/auth`) |
| `calace_csrf` | No | CSRF double-submit token |

## Security

- **bcrypt** (12 rounds) for passwords
- **Rate limiting** — `@nestjs/throttler` global + login attempt tracking in DB
- **Account lockout** — 5 failed attempts → 15 minute lock
- **CSRF** — double-submit cookie + `x-csrf-token` + `x-calace-client: web`
- **Audit log** — signup, login, password reset, email verify
- **Transactional email** — SMTP when configured (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`); development console logging when not

## Transactional email

Delivered via `EmailDeliveryService` (Nodemailer SMTP). Sender identity defaults to `Online CE Units - CAL ACE <support@cna.school>` (`SMTP_FROM` optional).

| Template | Trigger |
|----------|---------|
| Welcome (`welcome`) | Signup |
| Email verification (`email_verification`) | Signup + resend |
| Password reset (`password_reset`) | Forgot password |
| CEU completion (`ceu_completion`) | Placeholder helper |

Without SMTP, the API logs email content and records `Notification` rows as `PENDING` (verification logs: *SMTP not configured — verification email logged in development mode.*). When SMTP is configured but delivery fails, notifications are marked `FAILED` and errors are logged with categories (`invalid_credentials`, `connection_timeout`, etc.) — no development fallback body dump.

### Gmail SMTP (support@cna.school)

| Setting | Value |
| ------- | ----- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | unset or `false` (STARTTLS) |
| `SMTP_USER` | Google account with mailbox access |
| `SMTP_PASSWORD` | [App Password](https://myaccount.google.com/apppasswords) (2FA required) |
| `SMTP_FROM` | `Online CE Units - CAL ACE <support@cna.school>` |

Store variables in the **repository root `.env`** or `apps/api/.env.local` (same paths Nest loads). Restart the API after changes.

Verify connectivity:

```bash
pnpm --filter @calace/api run verify:smtp
# optional test message:
SMTP_TEST_TO=your-inbox@example.com pnpm --filter @calace/api run verify:smtp
```
