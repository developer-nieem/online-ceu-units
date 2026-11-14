# AI-Assisted Course Generation

Human instructors guide, review, correct, and approve. AI generates structured scaffolding mapped to the production 1-hour CNA CEU blueprint.

## Package: `@calace/ai-course-generation`

| Module | Role |
|--------|------|
| `providers/ai-course-provider.interface.ts` | Pluggable provider (mock / future OpenAI / Anthropic) |
| `providers/mock-ai-provider.ts` | Deterministic structured generator |
| `lesson-content-builder.ts` | `LessonContentDocument` v2 blocks per section |
| `generation-preview.ts` | CMS-safe outline preview (no full block dump) |
| `governance.ts` | PHI rejection + governance notice |
| `safety-checklist.ts` | 7-item instructor review checklist |
| `source-references.ts` | Citation / regulatory placeholders |
| `course-generation-template.ts` | Eight-requirement CNA CEU template + LLM prompt skeleton |
| `media-prompts.ts` | Thumbnail, video scripts, image prompts, captions (no media files) |
| `publish-guard.ts` | Blocks publish until instructor approved |

## API

| Endpoint | Access | Description |
|----------|--------|-------------|
| `GET /api/cms/ai/providers` | Admin, Instructor | Provider registry |
| `POST /api/cms/courses/generate/preview` | Admin, Instructor | Preview only — no DB write |
| `POST /api/cms/courses/generate` | Admin, Instructor | Create DRAFT course + audit log |
| `PATCH /api/cms/courses/:id/ai-approval` | Admin, Instructor | Approval + compliance status + audit |

## Structured mapping

```
GenerateCourseInput
  → CourseGenerationPlan
      → Course (DRAFT)
      → CourseVersion.contentMeta (aiGeneration, safety, media, blueprint)
      → Module[] → Lesson[] (LessonContentDocument)
      → Assessment + Question[] (exam bank)
```

## Governance

- **No PHI** in prompts (validated server-side)
- **No auto-publish** — `publishVersion` checks `aiGeneration.approvalStatus`
- **AuditLog** entries: `ai_course_generated`, `ai_course_approval`
- **Admin/instructor only** — CMS role guard unchanged

## Future integrations (`integrationHooks` in contentMeta)

- `openai` / `anthropic` — swap `getAiCourseProvider()` implementation
- `imageGeneration` / `videoGeneration` — attach after media pipeline
- `citationRag` — RAG source libraries for references
- `multiStateRules` — adapters beyond California

## CNA CEU template (8 requirements)

`CNA_CEU_GENERATION_TEMPLATE` in `course-generation-template.ts` enforces:

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Timeframe & pacing | `ONE_HOUR_CNA_CEU_BLUEPRINT` — 1 CE hour, 50 active min, 18 lessons |
| 2 | Behavioral objectives | `buildBehavioralObjectives()` — measurable CNA-scoped verbs |
| 3 | Curriculum outline | 3 modules via blueprint `modules[]` |
| 4 | Rich lesson content | `buildAiLessonDocument()` — infographic, case study, image blocks |
| 5 | Media elements | `video` blocks + `mediaPrompts.miniVideoScripts` |
| 6 | Inline pop quizzes | `knowledge_check` lessons ×2 in core-instruction module |
| 7 | Final exam | 10 `SINGLE_CHOICE` MCQs with rationales in `buildExamQuestions()` |
| 8 | Thumbnail | `mediaPrompts.courseThumbnail` → `catalogData.thumbnailGenerationPrompt` |

Future LLM providers: call `buildLlmGenerationPrompt(input)` and parse JSON into `CourseGenerationPlan`.

## Bulk generation (59 seeded topics)

```bash
pnpm --filter @calace/ai-course-generation build
pnpm --filter @calace/db db:seed-ai-bulk-courses
# Replace scaffold-only shells from professional-development seed:
pnpm --filter @calace/db db:seed-ai-bulk-courses -- --replace-scaffold
```

Reads `PROFESSIONAL_DEVELOPMENT_BULK_COURSES` (10 dementia/AI + 49 California CNA CEU topics).

## Testing

```bash
pnpm --filter @calace/ai-course-generation build
pnpm dev
```

1. **CMS → AI generate** — fill title, code, state, profession → **Preview blueprint**
2. Review outline → **Create draft course**
3. **Quality tab** — safety checklist, compliance status, approve
4. Try **Publish** before approval → blocked
5. Approve → publish succeeds
6. Admin **Audit** log shows generation and approval events

Login: `support@cna.school` (after `pnpm db:seed`).
