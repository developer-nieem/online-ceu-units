# Fast deploy guide — Neon → Railway → Vercel

**Correct order** (do not skip ahead):

```
1. Neon (database)
2. Railway (Nest API)
3. Vercel (Next.js web)
4. Connect URLs both ways
```

```
Browser → Vercel (apps/web) → /api/* → Railway (apps/api) → Neon Postgres
```

Accounts:
- Neon: your Neon project  
- Railway: GitHub `CalAce-Dev/renewal-cna-school`  
- Vercel: `calace@cna.school`  
- Branch to deploy: **`main`**

---

## Step 1 — Neon (database)

1. Open [console.neon.tech](https://console.neon.tech) and sign in.
2. Use an existing project **or** create a new one (recommended name: `calace-lms`).
3. Open **Dashboard → Connection details**.
4. Copy **two** URLs:

| Name | Which Neon URL |
| ---- | -------------- |
| `DATABASE_URL` | **Pooled** connection (host often has `-pooler`) + `?sslmode=require` |
| `DIRECT_URL` | **Direct** connection (no `-pooler`) + `?sslmode=require` |

5. Keep them in a notes app — you will paste into Railway next.  
   Never commit these into GitHub.

Optional (later, from your computer against this DB):

```bash
pnpm db:migrate:deploy
# only if you intentionally want seed data on this DB:
# SEED_DEV_PASSWORDS=true pnpm db:seed   ← NEVER on production
```

For a first staging deploy, if this Neon DB already has your local/dev schema + data, you can skip migrate/seed for now.

---

## Step 2 — Railway (API)

1. Open [railway.app](https://railway.app).
2. Open your existing **`@calace/api`** service (or create one from GitHub).
3. **Settings → Source**
   - Repo: `CalAce-Dev/renewal-cna-school`
   - Branch: **`main`**
   - Root Directory: **leave empty**
4. **Variables** → add:

| Variable | Value |
| -------- | ----- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL from Step 1 — prefer ending with `?sslmode=require` (remove `channel_binding=require` if present; it can break Railway) |
| `DIRECT_URL` | Neon direct URL from Step 1 — same `sslmode=require` tip |
| `JWT_ACCESS_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_ACCESS_EXPIRES_IN` | `8h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `DEFAULT_TENANT_SLUG` | `cal-ace` |
| `CAPTCHA_PROVIDER` | `none` |
| `SIGNUP_ENABLED` | `false` |
| `WEB_URL` | `https://placeholder.local` (update in Step 4) |
| `API_CORS_ORIGIN` | `https://placeholder.local` (update in Step 4) |

5. **Deployments → Redeploy** (or wait for auto-deploy).
6. Wait until status is **Success** (green).
7. **Settings → Networking → Generate Domain**.  
   Copy it, e.g. `https://something.up.railway.app` (**no** trailing slash).
8. Test in browser:

```
https://YOUR-RAILWAY-DOMAIN/api/health
```

You want a healthy JSON response. If this fails, stop — fix Railway before Vercel.

---

## Step 3 — Vercel (web)

1. Open [vercel.com](https://vercel.com) as `calace@cna.school`.
2. **Add New → Project** → Import `CalAce-Dev/renewal-cna-school`.
3. Configure:
   - **Root Directory:** `apps/web`
   - **Include files outside Root Directory:** **ON**
   - Branch: **`main`**
4. **Environment Variables:**

| Variable | Value |
| -------- | ----- |
| `NEXT_PUBLIC_API_URL` | Railway URL from Step 2 (e.g. `https://something.up.railway.app`) |
| `INTERNAL_API_URL` | **same** as `NEXT_PUBLIC_API_URL` |
| `NEXT_PUBLIC_APP_URL` | `https://placeholder.vercel.app` (update after first deploy) |
| `NEXT_PUBLIC_CAPTCHA_PROVIDER` | `none` |
| `DATABASE_URL` | Same Neon **pooled** URL as Railway (web uses `@calace/db` in some server routes) |
| `DIRECT_URL` | Same Neon **direct** URL as Railway |

> Build note: Prisma generate no longer requires a real DB at build time (dummy URLs fallback). Still set Neon URLs for **runtime**.

5. Click **Deploy**.
6. Copy the live site URL, e.g. `https://renewal-cna-school-xxx.vercel.app`.

---

## Step 4 — Connect them (required)

### On Railway Variables — update:

| Variable | Value |
| -------- | ----- |
| `WEB_URL` | your Vercel URL |
| `API_CORS_ORIGIN` | your Vercel URL |

Redeploy Railway.

### On Vercel Environment Variables — update:

| Variable | Value |
| -------- | ----- |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL |

Redeploy Vercel.

---

## Step 5 — Smoke test

1. `https://YOUR-RAILWAY/api/health` → OK  
2. `https://YOUR-VERCEL` → homepage loads  
3. Try `/login` from the Vercel site  
4. If login/catalog fails with 503 → Railway URL/env is wrong  

---

## Cheat sheet

| Order | Platform | What | Depends on |
| ----- | -------- | ---- | ---------- |
| 1 | Neon | Postgres | nothing |
| 2 | Railway | Nest API | Neon URLs |
| 3 | Vercel | Next.js | Railway URL |
| 4 | Both | CORS + APP URLs | each other’s public URLs |

---

## If Railway still shows “error deploying from source”

1. Branch must be **`main`**  
2. Root Directory must be **empty**  
3. Variables from Step 2 must be saved **before** redeploy  
4. Open the failed deployment → copy last ~30 log lines  

### Snapshot hang (“scheduling build on Metal builder” forever)

This is usually a **Railway infrastructure** issue, not your app code.

1. In Railway → `@calace/api` → **Settings → Source** → set branch to **`main`** → Save  
2. **Deployments → Redeploy** (or **Deploy** latest `main` commit)  
3. If snapshot hangs again 10+ minutes with no build logs:
   - Cancel the deployment  
   - Settings → Source → disconnect GitHub repo → reconnect → branch **`main`**  
   - Redeploy again  
4. If it keeps failing: contact Railway support with deployment ID and say snapshot hangs repeatedly  

Repo files that matter:
- `railway.toml`
- `Dockerfile.api`
- `apps/web/vercel.json`
