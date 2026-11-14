# Production Course Blueprint & Learning Experience Engine

CAL ACE uses a **repeatable 1-hour CNA CEU blueprint** so every course shares CDPH-aware structure, 50-minute active participation, exam/attestation/certificate/transcript flow, and CMS quality checks — without rebuilding from scratch.

## Package: `@calace/content-blocks`

| File | Role |
|------|------|
| `standard-one-hour-blueprint.ts` | v1.1 blueprint: 18 lessons, 3 modules, 50 active min |
| `blueprint-factory.ts` | Placeholder `LessonContentDocument` per section |
| `pacing-engine.ts` | 50-min minimum validation, warnings, `sumLessonActiveMinutes` |
| `exam-blueprint.ts` | 20-question bank target, 10 per attempt, 3 attempts, rationales |
| `learning-experience.ts` | Milestones, encouragement, completion roadmap |
| `quality-checklist.ts` | CMS production checklist from quality framework |

### Standard lesson flow (18 lessons)

**Orientation:** welcome · course information · learning objectives · instructor intro · key terms  

**Core instruction:** mini-video · core teaching content · CNA role (do/do not) · case study · scenario · knowledge check ×2 · reflection · CNA best practices  

**Completion pathway:** summary/recap · what happens next · attestation guide · certificate/transcript access  

**System steps (unchanged gating):** final exam · learner attestation · certificate unlock · transcript entry  

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/cms/blueprints` | List blueprints + pacing summary |
| `POST /api/cms/courses/from-blueprint` | Full structure + exam shell + contentMeta |
| `POST /api/cms/courses/:id/duplicate` | Clone modules/lessons/exams |
| `GET /api/cms/courses/:id/pacing` | Pacing + 50-min minimum + quality checklist |

`CourseVersion.contentMeta` extension points:

- `blueprint`, `learningExperience` (milestones + completionRoadmap)
- `qualityFramework`, `qualityChecklist`
- `ecosystemHooks` (badges, loyalty stars, referrals, CNA Network URL, forum, email, bundles — all `enabled: false`)
- `examBlueprint` (20-question bank target, messaging)

Player: `learningExperience.completionRoadmap`, `course.estimatedActiveMinutes`.

## CMS workflow

1. **CMS → New course → Standard 1-hour blueprint**
2. Edit placeholders in each lesson (blocks v2)
3. **Quality tab** — pacing + production checklist
4. Add exam questions toward **20-question bank** (learners see randomized subset)
5. **Publish** — versioning/approval workflow unchanged

**Duplicate structure** copies an existing blueprint course into a new draft.

## Time distribution validation

- Each lesson has `durationMinutes` = estimated active minutes
- `computeBlueprintPacing()` — sum, weighted participation, **meetsMinimumParticipation** (≥ 50)
- `validateLessonDurations()` — per-lesson drift + total minimum
- CMS shows lesson total, catalog 60 min, and warnings if too short/long

Seat-time, exam, attestation, certificate, and transcript enforcement are **not modified** — only metadata and UX around them.

## AI-generated courses (later)

Output schema v2 blocks matching `BlueprintSectionKind`. Stable block IDs (`{slug}-heading`, etc.). Set `generation.source: 'ai'`. No AI pipeline in this phase.

## Future loyalty / community

Flip `contentMeta.ecosystemHooks.cnaNetworkCommunity.enabled` and set `url` / `integrationId` when integrating — no migration required.

## Testing

```bash
pnpm --filter @calace/content-blocks build
pnpm dev
```

1. Admin → **CMS → New course → Standard blueprint** → 18 lessons, 3 modules, final exam placeholders  
2. **Quality tab** → pacing shows ≥ 50 min, checklist pending items  
3. Learner player → roadmap, milestones, lesson durations in sidebar  
4. Complete lesson → professional completion note; exam still gated by participation  

Login: `support@cna.school` (after `pnpm db:seed`).
