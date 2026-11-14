/**
 * Seed lesson content blocks from docs/lesson-drafts/*.md into Lesson.content JSON.
 * Idempotent: updates published course-version lessons by course + lesson slug.
 *
 * Run: cd packages/db && npx tsx prisma/seed-all-lesson-content.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type ContentBlock,
  type LessonContentDocument,
} from '@calace/content-blocks';
import { ContentPublishStatus, CourseVersionStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRAFTS_DIR = path.join(__dirname, '../../../docs/lesson-drafts');

const COURSE_DRAFT_FILES: Record<string, string> = {
  'communication-skills': 'communication-skills.md',
  'stress-management': 'stress-management.md',
  'mobility-safety': 'mobility-safety.md',
  'resident-rights': 'resident-rights.md',
  'elder-abuse-reporting': 'elder-abuse-reporting.md',
  'infection-control': 'infection-control.md',
  'dementia-care': 'dementia-care.md',
  'legal-ethical-nursing-practice': 'legal-ethical-nursing-practice.md',
  'workplace-violence-prevention': 'workplace-violence-prevention.md',
};

type ParsedLesson = {
  slug: string;
  title: string;
  moduleSlug: string;
  sections: Map<string, string>;
};

function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function nextSortOrder(counter: { value: number }): number {
  counter.value += 1;
  return counter.value;
}

function withSortOrder(block: ContentBlock, sortOrder: number): ContentBlock {
  return { ...block, meta: { ...block.meta, sortOrder, lessonBlock: true } };
}

function parseSections(lessonBody: string): Map<string, string> {
  const sections = new Map<string, string>();
  const parts = lessonBody.split(/\n#### /);
  for (const part of parts) {
    if (!part.trim()) continue;
    const newline = part.indexOf('\n');
    if (newline === -1) continue;
    const name = part.slice(0, newline).trim();
    const content = part.slice(newline + 1).trim();
    sections.set(name, content);
  }
  return sections;
}

function parseMarkdownFile(filePath: string): ParsedLesson[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lessons: ParsedLesson[] = [];

  const moduleChunks = raw.split(/\n## Module:/);
  for (const chunk of moduleChunks.slice(1)) {
    const moduleHeaderEnd = chunk.indexOf('\n');
    const moduleHeader = chunk.slice(0, moduleHeaderEnd).trim();
    const moduleSlugMatch = moduleHeader.match(/\(`([^`]+)`\)/);
    const moduleSlug = moduleSlugMatch?.[1] ?? slugifyId(moduleHeader);

    const lessonChunks = chunk.slice(moduleHeaderEnd).split(/\n### Lesson:/);
    for (const lessonChunk of lessonChunks.slice(1)) {
      const headerEnd = lessonChunk.indexOf('\n');
      const headerLine = lessonChunk.slice(0, headerEnd).trim();
      const slugMatch = headerLine.match(/\(`([^`]+)`\)/);
      const titleMatch = headerLine.match(/^(.+?)\s*\(/);
      if (!slugMatch || !titleMatch) continue;

      const slug = slugMatch[1];
      const title = titleMatch[1].trim();
      const body = lessonChunk.slice(headerEnd + 1).trim();

      lessons.push({
        slug,
        title,
        moduleSlug,
        sections: parseSections(body),
      });
    }
  }

  return lessons;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function buildMainContentBlocks(
  lessonSlug: string,
  content: string,
  counter: { value: number },
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const parts = content.split(/\n##### /);

  const hasSubsections = content.includes('\n##### ');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (!hasSubsections && i === 0) {
      for (const paragraph of splitParagraphs(part)) {
        blocks.push(
          withSortOrder(
            {
              id: `${lessonSlug}-text-${slugifyId(paragraph.slice(0, 24))}-${counter.value + 1}`,
              type: 'text',
              body: paragraph,
            },
            nextSortOrder(counter),
          ),
        );
      }
      continue;
    }

    const subsection = i === 0 ? part : part;
    const newline = subsection.indexOf('\n');
    const heading = newline === -1 ? subsection : subsection.slice(0, newline).trim();
    const body = newline === -1 ? '' : subsection.slice(newline + 1).trim();

    blocks.push(
      withSortOrder(
        {
          id: `${lessonSlug}-h3-${slugifyId(heading)}`,
          type: 'heading',
          level: 3,
          text: heading,
        },
        nextSortOrder(counter),
      ),
    );

    for (const paragraph of splitParagraphs(body)) {
      blocks.push(
        withSortOrder(
          {
            id: `${lessonSlug}-text-${slugifyId(heading)}-${slugifyId(paragraph.slice(0, 16))}`,
            type: 'text',
            body: paragraph,
          },
          nextSortOrder(counter),
        ),
      );
    }
  }

  return blocks;
}

function parseKnowledgeChecks(content: string): Array<{ question: string; answer: string }> {
  const checks: Array<{ question: string; answer: string }> = [];
  const pattern =
    /\*\*Question\s*(\d+):\*\*\s*([\s\S]*?)\n\n\*\*Answer:\*\*\s*([\s\S]*?)(?=\n\n\*\*Question\s*\d+:\*\*|$)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    checks.push({
      question: match[2].trim(),
      answer: match[3].trim(),
    });
  }

  return checks;
}

function buildKnowledgeCheckBlock(
  lessonSlug: string,
  index: number,
  question: string,
  answer: string,
  counter: { value: number },
): ContentBlock {
  const correctLabel = answer.length > 280 ? `${answer.slice(0, 277)}...` : answer;

  return withSortOrder(
    {
      id: `${lessonSlug}-kc-${index}`,
      type: 'knowledge_check',
      question,
      options: [
        { id: 'a', label: correctLabel },
        {
          id: 'b',
          label: 'No action is needed; continue routine care without reporting.',
        },
        {
          id: 'c',
          label: 'Handle the situation independently without involving the nurse.',
        },
      ],
      correctOptionId: 'a',
      explanation: answer,
      requiredForCompletion: true,
      accessibility: { ariaLabel: `Knowledge check question ${index}` },
    },
    nextSortOrder(counter),
  );
}

function buildLessonBlocks(lesson: ParsedLesson): ContentBlock[] {
  const counter = { value: 0 };
  const blocks: ContentBlock[] = [];

  blocks.push(
    withSortOrder(
      {
        id: `${lesson.slug}-heading-title`,
        type: 'heading',
        level: 1,
        text: lesson.title,
      },
      nextSortOrder(counter),
    ),
  );

  const objectives = lesson.sections.get('LEARNING OBJECTIVES');
  if (objectives) {
    blocks.push(
      withSortOrder(
        {
          id: `${lesson.slug}-heading-objectives`,
          type: 'heading',
          level: 2,
          text: 'Learning Objectives',
        },
        nextSortOrder(counter),
      ),
    );
    blocks.push(
      withSortOrder(
        {
          id: `${lesson.slug}-text-objectives`,
          type: 'text',
          body: objectives,
        },
        nextSortOrder(counter),
      ),
    );
  }

  const mainContent = lesson.sections.get('MAIN CONTENT');
  if (mainContent) {
    blocks.push(
      withSortOrder(
        {
          id: `${lesson.slug}-heading-main`,
          type: 'heading',
          level: 2,
          text: 'Main Content',
        },
        nextSortOrder(counter),
      ),
    );
    blocks.push(...buildMainContentBlocks(lesson.slug, mainContent, counter));
  }

  const keyPoints = lesson.sections.get('KEY POINTS');
  if (keyPoints) {
    blocks.push(
      withSortOrder(
        {
          id: `${lesson.slug}-callout-key-points`,
          type: 'callout',
          variant: 'tip',
          title: 'Key Points',
          body: keyPoints,
        },
        nextSortOrder(counter),
      ),
    );
  }

  const knowledgeCheck = lesson.sections.get('KNOWLEDGE CHECK');
  if (knowledgeCheck) {
    blocks.push(
      withSortOrder(
        {
          id: `${lesson.slug}-heading-kc`,
          type: 'heading',
          level: 2,
          text: 'Knowledge Check',
        },
        nextSortOrder(counter),
      ),
    );

    const checks = parseKnowledgeChecks(knowledgeCheck);
    checks.forEach((check, index) => {
      blocks.push(
        buildKnowledgeCheckBlock(lesson.slug, index + 1, check.question, check.answer, counter),
      );
    });
  }

  return blocks;
}

function buildLessonDocument(lesson: ParsedLesson): LessonContentDocument {
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title: lesson.title,
    generation: { source: 'human', promptVersion: 'lesson-drafts-v1' },
    blocks: buildLessonBlocks(lesson),
  };
}

async function findPublishedLesson(courseSlug: string, lessonSlug: string, moduleSlug: string) {
  return prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      deletedAt: null,
      module: {
        slug: moduleSlug,
        deletedAt: null,
        courseVersion: {
          status: CourseVersionStatus.PUBLISHED,
          deletedAt: null,
          course: { slug: courseSlug, deletedAt: null },
        },
      },
    },
    select: { id: true, title: true, slug: true, content: true },
  });
}

async function main() {
  const summary: Array<{
    courseSlug: string;
    lessonSlug: string;
    lessonId: string;
    blockCount: number;
  }> = [];

  let updated = 0;
  let skipped = 0;

  for (const [courseSlug, fileName] of Object.entries(COURSE_DRAFT_FILES)) {
    const filePath = path.join(DRAFTS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`Missing draft file: ${filePath}`);
      continue;
    }

    const parsedLessons = parseMarkdownFile(filePath);
    console.log(`\n${courseSlug}: parsed ${parsedLessons.length} lessons from ${fileName}`);

    for (const parsed of parsedLessons) {
      const dbLesson = await findPublishedLesson(courseSlug, parsed.slug, parsed.moduleSlug);

      if (!dbLesson) {
        console.warn(
          `  SKIP — no published lesson: ${courseSlug} / ${parsed.moduleSlug} / ${parsed.slug}`,
        );
        skipped += 1;
        continue;
      }

      const document = buildLessonDocument(parsed);

      await prisma.lesson.update({
        where: { id: dbLesson.id },
        data: {
          content: document as object,
          status: ContentPublishStatus.PUBLISHED,
        },
      });

      updated += 1;
      summary.push({
        courseSlug,
        lessonSlug: parsed.slug,
        lessonId: dbLesson.id,
        blockCount: document.blocks.length,
      });

      console.log(
        `  OK — ${parsed.slug} (${dbLesson.id}): ${document.blocks.length} blocks`,
      );
    }
  }

  console.log('\n========== SUMMARY ==========');
  console.log(`Lessons updated: ${updated}`);
  console.log(`Lessons skipped: ${skipped}`);
  console.log(`Total blocks seeded: ${summary.reduce((sum, row) => sum + row.blockCount, 0)}`);

  const byCourse = new Map<string, { lessons: number; blocks: number }>();
  for (const row of summary) {
    const entry = byCourse.get(row.courseSlug) ?? { lessons: 0, blocks: 0 };
    entry.lessons += 1;
    entry.blocks += row.blockCount;
    byCourse.set(row.courseSlug, entry);
  }

  console.log('\nBlocks per course:');
  for (const [courseSlug, stats] of [...byCourse.entries()].sort()) {
    console.log(`  ${courseSlug}: ${stats.lessons} lessons, ${stats.blocks} blocks`);
  }

  console.log('\nBlocks per lesson:');
  for (const row of summary) {
    console.log(`  ${row.courseSlug}/${row.lessonSlug} (${row.lessonId}): ${row.blockCount}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
