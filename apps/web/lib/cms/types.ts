/** Course publishing lifecycle — aligned with Prisma `CourseStatus`. */
export type CmsPublishStatus = 'draft' | 'published' | 'archived';

/** Reserved for future AI course-generation pipeline compatibility. */
export interface CmsAiMetadata {
  generationSource?: 'human' | 'ai_draft' | 'ai_assisted';
  lastAiDraftAt?: string;
  aiPromptVersion?: string;
  /** Outline slots AI can populate later without schema changes. */
  draftOutline?: string[];
}

export type CmsLessonBlockType = 'reading' | 'interaction' | 'quiz' | 'video';

export interface CmsLessonBlock {
  id: string;
  type: CmsLessonBlockType;
  title?: string;
  content?: string;
  videoUrl?: string;
  completionRequired?: boolean;
}

export type CmsLessonCompletionRule = 'view_all' | 'pass_quiz' | 'manual';

export interface CmsLesson {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  /** Primary lesson body text (markdown/plain). */
  body?: string;
  contentSummary?: string;
  videoUrl?: string;
  readingBlocks: CmsLessonBlock[];
  interactionBlocks: CmsLessonBlock[];
  quizBlocks: CmsLessonBlock[];
  completionRule: CmsLessonCompletionRule;
  estimatedMinutes?: number;
  requiredForCompletion?: boolean;
  status: CmsPublishStatus;
  courseId?: string;
}

/** Course pricing stored in catalog JSON — no separate migration. */
export interface CmsCoursePricing {
  /** List price in cents (USD). */
  priceCents: number;
  /** Optional promotional price in cents. */
  salePriceCents?: number | null;
  /** When false, course is not sold via checkout (admin enroll only). */
  pricingActive: boolean;
  /** Free / demo course — skips checkout and allows direct enrollment. */
  isFree: boolean;
}

export const DEFAULT_COURSE_PRICING: CmsCoursePricing = {
  priceCents: 2900,
  salePriceCents: null,
  pricingActive: true,
  isFree: false,
};

export interface CmsCourse {
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
  status: CmsPublishStatus;
  certificateEligible: boolean;
  finalExamRequired: boolean;
  passingScorePercent: number;
  thumbnailUrl?: string;
  complianceNotes: string;
  cdphNotes: string;
  instructor: string;
  tags: string[];
  lessons: CmsLesson[];
  pricing: CmsCoursePricing;
  aiMetadata?: CmsAiMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type CmsCourseInput = Omit<CmsCourse, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  id?: string;
};

export interface CmsCourseListFilters {
  status?: CmsPublishStatus | 'all';
  category?: string | 'all';
  query?: string;
}

/** Learner enrollment overlay on catalog records. */
export type LearnerEnrollmentStatus =
  | 'not_enrolled'
  | 'active'
  | 'completed'
  | 'archived'
  | 'revoked'
  | 'requires_reset'
  | 'requires_repurchase';

export interface LearnerCourseView extends CmsCourse {
  enrollmentId?: string;
  enrollmentStatus?: LearnerEnrollmentStatus;
  progressPercent?: number;
  completedOn?: string;
  enrolledAt?: string;
}
