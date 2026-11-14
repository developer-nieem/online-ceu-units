# @calace/content-blocks

Shared **lesson content schema v2** and block progress helpers for the CAL ACE CEU LMS.

## Usage

```ts
import {
  LESSON_CONTENT_SCHEMA_VERSION,
  isBlockDocument,
  type LessonContentDocument,
  type ContentBlock,
  computeLessonProgressPct,
} from '@calace/content-blocks';
```

## Lesson JSON (`Lesson.content`)

```json
{
  "schemaVersion": 2,
  "title": "Lesson title",
  "blocks": [{ "id": "intro", "type": "text", "body": "..." }],
  "generation": { "source": "human" }
}
```

## Block types

`heading`, `text`, `image`, `infographic`, `video`, `audio`, `callout`, `case_study`, `scenario_question`, `knowledge_check`, `reflection`, `summary`, plus interactive placeholders (`matching`, `reveal_card`, `arrange`, `hotspot_image`).

## Sample lesson

`RECOGNIZING_EARLY_SIGNS_LESSON` — Dementia Care → `recognizing-early-signs`

## Consumers

| Package / app | Role |
|---------------|------|
| `@calace/db` | Seeds sample lesson |
| `@calace/api` | Player API, block progress |
| `@calace/web` | `LessonBlocksPlayer` renderers |

See [docs/CONTENT_BLOCKS.md](../../docs/CONTENT_BLOCKS.md).
