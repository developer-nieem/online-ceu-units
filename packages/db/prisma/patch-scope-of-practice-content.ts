/**

 * Inject lesson content for "Scope of Practice & Patient Rights".

 * Run: pnpm --filter @calace/db db:patch-scope-of-practice-content

 */

import { LESSON_CONTENT_SCHEMA_VERSION } from '@calace/content-blocks';

import { PrismaClient } from '@prisma/client';



const prisma = new PrismaClient();



const COURSE_SLUG = 'legal-ethical-nursing-practice';

const LESSON_SLUG = 'scope-of-practice';



const READING_BLOCKS = [

  {

    id: 'rb-le-1',

    type: 'reading',

    title: 'Defining the CNA Scope of Practice',

    content:

      'Certified nursing assistants provide hands-on care under the supervision of licensed nurses. Your scope includes activities you are trained and authorized to perform—such as bathing, dressing, feeding, ambulation, vital signs within facility policy, and accurate documentation. Tasks that require nursing assessment, medication administration, or independent clinical judgment remain outside CNA scope and must be escalated to an RN or LVN.',

  },

  {

    id: 'rb-le-2',

    type: 'reading',

    title: 'Resident Rights & Dignity',

    content:

      'California law protects every resident’s right to privacy, dignity, and participation in care decisions. CNAs must honor preferences for personal care, maintain confidentiality, and report concerns about abuse, neglect, or rights violations without delay. Treating each person as an individual—not a diagnosis—supports both ethical practice and regulatory compliance.',

  },

  {

    id: 'rb-le-3',

    type: 'reading',

    title: 'Professional Boundaries & Documentation',

    content:

      'Clear boundaries protect residents and your license. Avoid accepting gifts that could influence care, sharing personal contact information, or performing tasks beyond your certification. Document observations objectively and promptly: what you saw, heard, or measured—not opinions or diagnoses. When unsure whether an action is within scope, stop and ask your charge nurse before proceeding.',

  },

];



const KNOWLEDGE_CHECK = {

  id: 'kc-consent-boundary',

  type: 'knowledge_check' as const,

  question:

    'A resident asks you to help them sign a consent form for a new treatment. They seem confused about what they are agreeing to. What is the most appropriate CNA response?',

  options: [

    {

      id: 'a',

      label: 'Sign the form for them since they asked for your help',

    },

    {

      id: 'b',

      label: 'Pause care and notify the nurse — obtaining informed consent is outside CNA scope',

    },

    {

      id: 'c',

      label: 'Explain the treatment details yourself so they feel comfortable signing',

    },

  ],

  correctOptionId: 'b',

  explanation:

    'Obtaining informed consent and explaining medical treatments require nursing or provider scope. Your role is to recognize the concern, support the resident’s dignity, and escalate to the licensed nurse immediately.',

  requiredForCompletion: true as const,

  accessibility: { ariaLabel: 'Knowledge check on informed consent and scope of practice' },

};



function buildLessonContent() {

  const [first, ...rest] = READING_BLOCKS;



  return {

    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,

    title: 'Scope of Practice & Patient Rights',

    generation: { source: 'human' as const },

    blocks: [

      {

        id: 'heading-scope',

        type: 'heading' as const,

        level: 1 as const,

        text: 'Scope of Practice & Patient Rights',

      },

      {

        id: first.id,

        type: 'heading' as const,

        level: 2 as const,

        text: first.title,

      },

      {

        id: `${first.id}-body`,

        type: 'text' as const,

        body: first.content,

      },

      KNOWLEDGE_CHECK,

      ...rest.flatMap((block) => [

        {

          id: block.id,

          type: 'heading' as const,

          level: 2 as const,

          text: block.title,

        },

        {

          id: `${block.id}-body`,

          type: 'text' as const,

          body: block.content,

        },

      ]),

    ],

  };

}



async function main() {

  const lesson = await prisma.lesson.findFirst({

    where: {

      slug: LESSON_SLUG,

      deletedAt: null,

      module: {

        deletedAt: null,

        courseVersion: {

          deletedAt: null,

          course: { slug: COURSE_SLUG, deletedAt: null },

        },

      },

    },

    select: { id: true, title: true, content: true },

  });



  if (!lesson) {

    console.error(`Lesson not found: ${COURSE_SLUG} / ${LESSON_SLUG}`);

    process.exit(1);

  }



  const lessonContent = buildLessonContent();



  await prisma.lesson.update({

    where: { id: lesson.id },

    data: {

      content: {

        ...lessonContent,

        readingBlocks: READING_BLOCKS,

      },

    },

  });



  console.log(`Updated lesson content for "${lesson.title}" (${lesson.id}).`);

}



main()

  .catch((error) => {

    console.error(error);

    process.exit(1);

  })

  .finally(() => prisma.$disconnect());


