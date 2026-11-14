# Admin Operations Dashboard

Internal CAL ACE dashboard for monitoring learners, courses, credentials, compliance signals, audit activity, and billing/support placeholders.

## Access

| Surface | Path | Roles |
|---------|------|-------|
| Web UI | `/admin` | `admin` only |
| API | `/api/admin/*` | `admin` only (`@Roles(ROLE_SLUG.ADMIN)` on `AdminController`) |

Instructors can use `/cms` but **cannot** access `/admin`.

### Dev login

After `pnpm db:seed` (non-production):

- **Email:** `support@cna.school`
- **Password:** `SuccesS8@8` (see `docs/AUTH.md`)

## Web routes

| Route | Purpose |
|-------|---------|
| `/admin` | Overview metric cards |
| `/admin/learners` | Search/list learners |
| `/admin/students` | All enrolled students and enrollment totals, every plan |
| `/admin/learners/:id` | Profile, enrollments, certs, transcript, compliance JSON |
| `/admin/courses` | Per-course ops stats (published version) |
| `/admin/courses/:id` | Stats for all versions |
| `/admin/certificates` | Issued certs, verification codes, warnings |
| `/admin/audit` | Filterable audit log |
| `/admin/revenue` | Order/subscription placeholders |
| `/admin/support` | Ticket placeholders |

## API endpoints

All require an authenticated admin session (JWT cookie).

- `GET /api/admin/dashboard`
- `GET /api/admin/enrolled-students?search=&page=`
- `GET /api/admin/learners?search=&limit=`
- `GET /api/admin/learners/:userId`
- `GET /api/admin/courses`
- `GET /api/admin/courses/:courseId`
- `GET /api/admin/certificates?search=&limit=`
- `GET /api/admin/audit?category=&limit=`
- `GET /api/admin/revenue`
- `GET /api/admin/support`

## Protection layers

1. **Middleware** (`apps/web/middleware.ts`) — requires `calace_access` cookie for `/admin/*`; redirects to login with `?next=/admin`.
2. **Layout** (`apps/web/app/(admin)/admin/layout.tsx`) — server session check; non-admins redirect to `/dashboard`.
3. **API** — global JWT guard + `@Roles(admin)` on the admin controller.

## Data sources (Prisma)

| Metric / view | Models / logic |
|---------------|----------------|
| Learners | `User` + `userRoles` (learner role filter) |
| Enrolled students | `Enrollment` rows with `deletedAt` null. People are counted once; enrollment records are counted separately. Plan and membership do not exclude anyone. |
| Enrollments / progress | `Enrollment.metadata.progressPct` |
| Completions / CE hours | `Completion` (approved + cert issued) |
| Certificates | `Certificate`, `VerificationToken` |
| Exam pass rate | `AssessmentAttempt` (final exam, passed/failed/graded) |
| Seat-time compliance | `Enrollment.metadata.participationLedger` + `requiredActiveParticipationMinutes` |
| Compliance summary | `ComplianceService.getSummaryForUser` |
| Audit log | `AuditLog` (categories mapped in `AdminAuditService`) |
| Revenue | `Order` (PAID/REFUNDED/FAILED), `Subscription` |
| Support | `SupportTicket` |

Refunds processing and Stripe webhooks are **not** implemented; revenue UI is read-only placeholder.

## Enrolled students

`/admin/students` is the roster of everyone with an enrollment record. It is not limited to students on a 2-Year Unlimited membership.

- **Enrolled students** counts distinct people. Several enrollment records for the same person count as one student.
- **Enrollments** counts enrollment records. That total is shown with the student names.
- Both numbers come from enrollment rows that are not deleted. 1-Year Unlimited, 2-Year Unlimited, single-course, free, and any other plan are included.
- Development and internal test accounts are omitted: `@example.com` and `.test` addresses, the `gmail.acom` typo used in testing, accounts with `metadata.seeded`, accounts whose first name is “test”, and the named internal test emails in `INTERNAL_TEST_EMAILS`. Nothing is deleted.
- The 1-Year and 2-Year Unlimited member pages, including eligibility for the Milpitas campus discount, are unchanged.

## Test plan

```bash
pnpm db:seed
pnpm dev
```

1. Log in as `support@cna.school` / `SuccesS8@8`.
2. Open `/admin` — overview cards should load (zeros OK on fresh DB).
3. Sidebar: learners, courses, certificates, audit, revenue, support.
4. Log in as `instructor@cna.school` — `/admin` should redirect to `/dashboard`; `/cms` still works.
5. Log out / incognito — `/admin` redirects to login.

Optional API check with admin cookie:

```bash
curl -b "calace_access=..." http://localhost:3001/api/admin/dashboard
```
