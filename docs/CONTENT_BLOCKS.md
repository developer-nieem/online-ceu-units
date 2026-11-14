# Lesson content blocks (schema v2)

## Storage

`Lesson.content` JSON in Postgres:

```json
{
  "schemaVersion": 2,
  "title": "Lesson title",
  "blocks": [ { "id": "...", "type": "text", "body": "..." } ],
  "generation": { "source": "ai", "model": "...", "promptVersion": "..." }
}
```

Legacy v1 `{ type: "text", body: "..." }` lessons still render via the legacy player path.

## Block types

| Type | Purpose |
|------|---------|
| `heading` | Section titles (h1–h3) |
| `text` | Markdown-lite narrative |
| `image` / `infographic` | Visual assets + alt text |
| `video` / `audio` | Media placeholders (captions/transcript fields) |
| `callout` | Objectives, tips, warnings |
| `case_study` | CNA scenario narratives |
| `scenario_question` | Branching MCQ with feedback |
| `knowledge_check` | Graded check with explanation |
| `reflection` | Free-text prompt |
| `summary` | Takeaways list |
| `matching` / `reveal_card` / `arrange` / `hotspot_image` | Interactive placeholders |

## Progress

Stored in `LessonProgress.metadata.blockProgress`:

- `block_viewed` — IntersectionObserver when block enters viewport
- `interaction_completed` — scenario, reflection, placeholders
- `knowledge_check_answered` — graded selection

API: `POST /api/player/courses/:slug/lessons/:lessonSlug/block-progress`

## Sample lesson

**Dementia Care for CNAs** → **Recognizing Early Signs of Cognitive Decline**  
Slug: `recognizing-early-signs` (seeded via `@calace/content-blocks`).

## AI pipeline (future)

1. Prompt outputs `LessonContentDocument` JSON matching `@calace/content-blocks` types.
2. CMS or job stores document on `Lesson.content`.
3. Player + progress engine work unchanged — no renderer changes per course.

## Multimedia & gamification (future)

- `video`/`audio` blocks gain `mediaAssetId` → stream URLs + captions
- Interactive blocks swap `placeholderNote` for engine config (xAPI, SCORM, custom React islands)
- Gamification hooks on `interaction_completed` events (points, badges)
