# Course Authoring CMS

Internal content management for CAL ACE staff (`admin` and `instructor` roles).

## Access

- Web: `/cms` (requires login + staff role; others redirect to `/dashboard`)
- API: `/api/cms/*` (JWT + `@Roles('admin' | 'instructor')`)

### Development login (local seed only)

| Account | Email | Password |
|---------|--------|----------|
| Admin | `support@cna.school` | `SuccesS8@8` |
| Instructor (CMS author) | `instructor@cna.school` | `SuccesS8@8` |

Password for both accounts: **`SuccesS8@8`**

**Development only** — `pnpm db:seed` writes `passwordHash` only when `NODE_ENV !== 'production'`. Production must not use this default; provision staff accounts securely.

If login fails after an older seed, run `pnpm db:seed` again — staff credentials are re-applied idempotently via `seedDevStaffUsers()` in `packages/db/prisma/seed-dev-auth.ts`.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  Next.js /cms   │────▶│  Nest CmsModule  │────▶│  Prisma (Course tree)   │
│  (staff UI)     │     │  /api/cms/*      │     │  Lesson.content JSON v2 │
└─────────────────┘     └──────────────────┘     └─────────────────────────┘
         │                                                  │
         └──────────────────────────────────────────────────┘
                    Learner catalog/player reads PUBLISHED only
```

### Versioning (foundation)

| Layer | Field | Purpose |
|-------|--------|---------|
| Course | `status` | Draft / Review / Published / Archived (catalog visibility) |
| CourseVersion | `versionNumber`, `status` | Draft edits vs published snapshot |
| Module / Lesson | `status` | Published with version on release |

**Rules:**

1. Staff edits only **DRAFT** `CourseVersion` rows.
2. If the latest version is **PUBLISHED**, `ensureEditableVersion()` clones it to a new draft (`POST /cms/courses/:id/versions`).
3. **Publish** retires other published versions (`RETIRED`), sets draft → `PUBLISHED`, and publishes modules/lessons.
4. Enrollments/completions stay on the version the learner started — certificate integrity preserved.

Full diff/audit UI is future work; `contentMeta.versioning` holds revision notes and `immutableAfterPublish`.

### Publishing workflow

`DRAFT` → `REVIEW` (submit) → `PUBLISHED` (publish draft version) → `ARCHIVED` (soft-delete course)

### Content blocks

Lessons store `@calace/content-blocks` schema v2 in `Lesson.content`. CMS block editor supports all launch block types; media uses placeholders until upload infrastructure exists.

### Assessments

Final exams attach to `CourseVersion`. Questions support types from `QuestionType` enum; `settings` JSON holds pool size and randomization (`AssessmentSettings`).

## API surface (summary)

| Method | Path |
|--------|------|
| GET | `/api/cms/dashboard` |
| GET | `/api/cms/courses` |
| POST | `/api/cms/courses` |
| GET/PATCH | `/api/cms/courses/:courseId` |
| POST | `/api/cms/courses/:courseId/versions` |
| POST | `/api/cms/courses/:courseId/versions/:versionId/publish` |
| GET/PUT | `/api/cms/lessons/:lessonId/content` |
| GET | `/api/cms/courses/:courseId/versions/:versionId/assessments` |
| POST/PATCH | `/api/cms/assessments/:id/questions` |

## Future AI-generated courses

AI pipelines should output the same `LessonContentDocument` and `Question` rows:

1. Generate block JSON → `PUT /lessons/:id/content`
2. Generate question bank → `POST /assessments/:id/questions`
3. Human review in CMS → Submit for review → Publish

Optional `generation` metadata on lessons records model/prompt version.

## Testing

1. `pnpm db:seed` — dev passwords applied when `NODE_ENV !== 'production'`
2. `pnpm dev` — API :3001, web :3000
3. Log in at `/login` with `support@cna.school` / `SuccesS8@8` → open `/cms`
4. Edit a course → Lessons tab → Edit blocks → Save
5. Publish draft → verify `/courses` shows updated catalog (published course)
6. Non-learner user (signup) → `/cms` should redirect to dashboard
