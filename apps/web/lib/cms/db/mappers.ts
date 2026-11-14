import type { Prisma } from '@calace/db';
import { CourseStatus, CourseVersionStatus } from '@calace/db';

import type {
  CmsAiMetadata,
  CmsCourse,
  CmsCourseInput,
  CmsCoursePricing,
  CmsLesson,
  CmsPublishStatus,
} from '../types';
import { DEFAULT_COURSE_PRICING } from '../types';

export const DEFAULT_TENANT_SLUG = 'cal-ace';

export interface CourseCatalogData {
  fullDescription: string;
  deliveryMethod: 'Online';
  estimatedSeatTimeMinutes: number;
  category: string;
  active: boolean;
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
  publishedAt?: string;
  legacySeedId?: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toPrismaCourseStatus(status: CmsPublishStatus): CourseStatus {
  switch (status) {
    case 'published':
      return CourseStatus.PUBLISHED;
    case 'archived':
      return CourseStatus.ARCHIVED;
    default:
      return CourseStatus.DRAFT;
  }
}

export function fromPrismaCourseStatus(status: CourseStatus): CmsPublishStatus {
  switch (status) {
    case CourseStatus.PUBLISHED:
      return 'published';
    case CourseStatus.ARCHIVED:
      return 'archived';
    default:
      return 'draft';
  }
}

export function toPrismaVersionStatus(status: CmsPublishStatus): CourseVersionStatus {
  return status === 'published' ? CourseVersionStatus.PUBLISHED : CourseVersionStatus.DRAFT;
}

export function buildCatalogData(input: CmsCourseInput, publishedAt?: string): CourseCatalogData {
  return {
    fullDescription: input.fullDescription,
    deliveryMethod: input.deliveryMethod,
    estimatedSeatTimeMinutes: input.estimatedSeatTimeMinutes,
    category: input.category,
    active: input.active,
    certificateEligible: input.certificateEligible,
    finalExamRequired: input.finalExamRequired,
    passingScorePercent: input.passingScorePercent,
    thumbnailUrl: input.thumbnailUrl,
    complianceNotes: input.complianceNotes,
    cdphNotes: input.cdphNotes,
    instructor: input.instructor,
    tags: input.tags,
    lessons: input.lessons,
    pricing: input.pricing,
    aiMetadata: input.aiMetadata,
    publishedAt,
    legacySeedId: input.id,
  };
}

export function parseCatalogData(raw: Prisma.JsonValue): CourseCatalogData {
  const data = raw as unknown as CourseCatalogData;
  return {
    fullDescription: data.fullDescription ?? '',
    deliveryMethod: data.deliveryMethod ?? 'Online',
    estimatedSeatTimeMinutes: data.estimatedSeatTimeMinutes ?? 60,
    category: data.category ?? 'Clinical Practice',
    active: data.active ?? true,
    certificateEligible: data.certificateEligible ?? true,
    finalExamRequired: data.finalExamRequired ?? false,
    passingScorePercent: data.passingScorePercent ?? 80,
    thumbnailUrl: data.thumbnailUrl,
    complianceNotes: data.complianceNotes ?? '',
    cdphNotes: data.cdphNotes ?? '',
    instructor: data.instructor ?? 'CAL ACE Nursing Academy Faculty',
    tags: data.tags ?? [],
    lessons: (data.lessons ?? []) as CmsLesson[],
    pricing: normalizePricing(data.pricing),
    aiMetadata: data.aiMetadata,
    publishedAt: data.publishedAt,
    legacySeedId: data.legacySeedId,
  };
}

export function normalizePricing(raw?: Partial<CmsCoursePricing> | null): CmsCoursePricing {
  if (!raw) {
    return { ...DEFAULT_COURSE_PRICING };
  }

  return {
    priceCents: typeof raw.priceCents === 'number' ? raw.priceCents : DEFAULT_COURSE_PRICING.priceCents,
    salePriceCents:
      raw.salePriceCents === null || typeof raw.salePriceCents === 'number'
        ? raw.salePriceCents
        : null,
    pricingActive: raw.pricingActive ?? DEFAULT_COURSE_PRICING.pricingActive,
    isFree: raw.isFree ?? DEFAULT_COURSE_PRICING.isFree,
  };
}

type DbCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  status: CourseStatus;
  ceHours: Prisma.Decimal;
  catalogData: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  versions?: Array<{ publishedAt: Date | null }>;
};

export function mapDbCourseToCms(course: DbCourse): CmsCourse {
  const catalog = parseCatalogData(course.catalogData);
  const versionPublishedAt = course.versions?.[0]?.publishedAt;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.summary ?? '',
    fullDescription: catalog.fullDescription,
    ceUnits: Number(course.ceHours),
    deliveryMethod: catalog.deliveryMethod,
    estimatedSeatTimeMinutes: catalog.estimatedSeatTimeMinutes,
    category: catalog.category,
    active: catalog.active,
    status: fromPrismaCourseStatus(course.status),
    certificateEligible: catalog.certificateEligible,
    finalExamRequired: catalog.finalExamRequired,
    passingScorePercent: catalog.passingScorePercent,
    thumbnailUrl: catalog.thumbnailUrl,
    complianceNotes: catalog.complianceNotes,
    cdphNotes: catalog.cdphNotes,
    instructor: catalog.instructor,
    tags: catalog.tags,
    lessons: catalog.lessons,
    pricing: catalog.pricing,
    aiMetadata: catalog.aiMetadata,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    publishedAt:
      catalog.publishedAt ??
      (versionPublishedAt ? versionPublishedAt.toISOString() : undefined),
  };
}

export function mergeCoursePatch(existing: CmsCourse, patch: Partial<CmsCourseInput>): CmsCourseInput {
  return {
    slug: patch.slug ?? existing.slug,
    title: patch.title ?? existing.title,
    shortDescription: patch.shortDescription ?? existing.shortDescription,
    fullDescription: patch.fullDescription ?? existing.fullDescription,
    ceUnits: patch.ceUnits ?? existing.ceUnits,
    deliveryMethod: patch.deliveryMethod ?? existing.deliveryMethod,
    estimatedSeatTimeMinutes: patch.estimatedSeatTimeMinutes ?? existing.estimatedSeatTimeMinutes,
    category: patch.category ?? existing.category,
    active: patch.active ?? existing.active,
    status: patch.status ?? existing.status,
    certificateEligible: patch.certificateEligible ?? existing.certificateEligible,
    finalExamRequired: patch.finalExamRequired ?? existing.finalExamRequired,
    passingScorePercent: patch.passingScorePercent ?? existing.passingScorePercent,
    thumbnailUrl: patch.thumbnailUrl ?? existing.thumbnailUrl,
    complianceNotes: patch.complianceNotes ?? existing.complianceNotes,
    cdphNotes: patch.cdphNotes ?? existing.cdphNotes,
    instructor: patch.instructor ?? existing.instructor,
    tags: patch.tags ?? existing.tags,
    lessons: patch.lessons ?? existing.lessons,
    pricing: patch.pricing ?? existing.pricing,
    aiMetadata: patch.aiMetadata ?? existing.aiMetadata,
  };
}
