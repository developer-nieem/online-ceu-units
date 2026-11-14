import type { CatalogCourse, CourseDifficulty } from './catalog';



export type CourseLessonOutline = {

  id: string;

  slug: string;

  title: string;

  durationMinutes: number | null;

  sortOrder: number;

};



export type CourseModuleOutline = {

  id: string;

  slug: string;

  title: string;

  description: string | null;

  sortOrder: number;

  lessons: CourseLessonOutline[];

};



export type CourseFaqItem = { question: string; answer: string };



/** Learner-safe course compliance (no CDPH application / audit package fields). */

export type CourseComplianceInfo = {

  providerName: string;

  providerContact: string | null;

  supportContact: string | null;

  approvalStatusLabel: string | null;

  completionRequirements: string[];

};



export type CourseDetail = CatalogCourse & {

  courseVersionId: string | null;

  overview: string;

  learningObjectives: string[];

  faq: CourseFaqItem[];

  compliance: CourseComplianceInfo;

  imageAccent: string;

  heroImage: string | null;

  subscriptionEligible: boolean;

  modules: CourseModuleOutline[];

};



export type { CourseDifficulty };

