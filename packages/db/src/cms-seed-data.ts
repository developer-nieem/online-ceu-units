export interface CmsSeedCoursePricing {
  priceCents: number;
  salePriceCents?: number | null;
  pricingActive: boolean;
  isFree: boolean;
}

export interface CmsSeedCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  ceUnits: number;
  deliveryMethod: 'Online';
  estimatedSeatTimeMinutes: number;
  category: string;
  active: boolean;
  status: 'draft' | 'published' | 'archived';
  certificateEligible: boolean;
  finalExamRequired: boolean;
  passingScorePercent: number;
  thumbnailUrl?: string;
  complianceNotes: string;
  cdphNotes: string;
  instructor: string;
  tags: string[];
  pricing: CmsSeedCoursePricing;
  lessons: Array<Record<string, unknown>>;
  aiMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

function lesson(
  id: string,
  slug: string,
  title: string,
  sortOrder: number,
  opts: Record<string, unknown> = {},
) {
  return {
    id,
    slug,
    title,
    sortOrder,
    contentSummary: opts.contentSummary ?? '',
    videoUrl: opts.videoUrl,
    readingBlocks: opts.readingBlocks ?? [],
    interactionBlocks: opts.interactionBlocks ?? [],
    quizBlocks: opts.quizBlocks ?? [],
    completionRule: opts.completionRule ?? 'view_all',
    estimatedMinutes: opts.estimatedMinutes ?? 20,
    status: opts.status ?? 'published',
  };
}

export const CMS_SEED_COURSES: CmsSeedCourse[] = [
  {
    id: 'course-legal-ethical',
    slug: 'legal-ethical-nursing-practice',
    title: 'Legal & Ethical Issues in Nursing Practice',
    shortDescription:
      'Professional boundaries, consent, documentation, and ethical decision-making for CNAs.',
    fullDescription:
      'Explore legal and ethical responsibilities of nursing assistants including scope of practice, patient rights, mandatory reporting, and professional conduct standards under California regulations.',
    ceUnits: 1,
    deliveryMethod: 'Online',
    estimatedSeatTimeMinutes: 55,
    category: 'Professional Practice',
    active: true,
    status: 'published',
    certificateEligible: true,
    finalExamRequired: true,
    passingScorePercent: 80,
    complianceNotes: 'Addresses legal/ethical CE topics commonly required for CNA renewal cycles.',
    cdphNotes: 'May count toward annual CE/In-Service hour requirements per CDPH policy.',
    instructor: 'CAL ACE Nursing Academy Faculty',
    tags: ['ethics', 'legal', 'CNA', 'professionalism'],
    pricing: {
      priceCents: 0,
      salePriceCents: null,
      pricingActive: true,
      isFree: true,
    },
    lessons: [
      lesson('lesson-le-1', 'scope-of-practice', 'Scope of Practice & Patient Rights', 1, {
        contentSummary:
          'Understand CNA scope of practice, resident rights, and professional boundaries in California.',
        readingBlocks: [
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
        ],
        estimatedMinutes: 30,
      }),
      lesson('lesson-le-2', 'final-exam', 'Final Exam', 2, {
        quizBlocks: [{ id: 'qb-le-1', type: 'quiz', title: 'Final Exam', completionRequired: true }],
        completionRule: 'pass_quiz',
        estimatedMinutes: 25,
      }),
    ],
    aiMetadata: { generationSource: 'human' },
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    publishedAt: '2026-01-20T09:00:00Z',
  },
  {
    id: 'course-workplace-violence',
    slug: 'workplace-violence-prevention',
    title: 'Workplace Violence Prevention in Healthcare',
    shortDescription:
      'Recognize, de-escalate, and report workplace violence in healthcare environments.',
    fullDescription:
      'Training on identifying warning signs, de-escalation techniques, incident reporting, and employer responsibilities under California workplace violence prevention requirements for healthcare workers.',
    ceUnits: 1,
    deliveryMethod: 'Online',
    estimatedSeatTimeMinutes: 50,
    category: 'Safety & Compliance',
    active: true,
    status: 'published',
    certificateEligible: true,
    finalExamRequired: true,
    passingScorePercent: 80,
    complianceNotes: 'Supports workplace safety CE requirements for healthcare personnel.',
    cdphNotes: 'Verify applicability with employer in-service policies and CDPH guidance.',
    instructor: 'CAL ACE Nursing Academy Faculty',
    tags: ['workplace violence', 'safety', 'CNA', 'OSHA'],
    pricing: {
      priceCents: 2900,
      salePriceCents: null,
      pricingActive: true,
      isFree: false,
    },
    lessons: [
      lesson('lesson-wv-1', 'recognition', 'Recognition & De-escalation', 1, { estimatedMinutes: 30 }),
      lesson('lesson-wv-2', 'final-exam', 'Final Exam', 2, {
        quizBlocks: [{ id: 'qb-wv-1', type: 'quiz', title: 'Final Exam', completionRequired: true }],
        completionRule: 'pass_quiz',
        estimatedMinutes: 20,
      }),
    ],
    aiMetadata: { generationSource: 'human' },
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    publishedAt: '2026-02-05T09:00:00Z',
  },
];
