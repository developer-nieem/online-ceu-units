import { SINGLE_COURSE_PRICE } from './pricing';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  /** PUBLISHED = live; DRAFT/REVIEW = under finalization (list endpoint only). */
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  summary: string;
  categorySlug: string;
  categoryName: string;
  ceHours: number;
  price: number;
  isFree: boolean;
  durationMinutes: number;
  /** When set by API/catalogData (e.g. launch "1h"). */
  displayDuration?: string | null;
  difficulty: CourseDifficulty;
  instructor: string;
  featured: boolean;
  hasFreePreview: boolean;
  subscriptionEligible?: boolean;
};

export type CatalogCategory = {
  slug: string;
  name: string;
  description: string | null;
  courseCount: number;
};

/** Fallback catalog when API is unavailable — aligned with seed slugs */
export const PLACEHOLDER_CATALOG: CatalogCourse[] = [
  {
    id: '1',
    slug: 'dementia-care',
    title: 'Dementia Care for Nursing Assistants',
    summary: 'Person-centered dementia care for California CNAs.',
    categorySlug: 'professional-development',
    categoryName: 'Professional Development',
    ceHours: 1,
    price: SINGLE_COURSE_PRICE,
    isFree: false,
    durationMinutes: 60,
    difficulty: 'intermediate',
    instructor: 'James Okonkwo, LVN',
    featured: true,
    hasFreePreview: true,
  },
  {
    id: '2a',
    slug: 'elder-abuse-reporting',
    title: 'Elder & Dependent Adult Abuse Reporting',
    summary: 'Mandatory California abuse recognition and reporting for CNAs.',
    categorySlug: 'elder-abuse',
    categoryName: 'Elder Abuse Prevention',
    ceHours: 1,
    price: SINGLE_COURSE_PRICE,
    isFree: false,
    durationMinutes: 60,
    difficulty: 'beginner',
    instructor: 'CAL ACE Faculty',
    featured: true,
    hasFreePreview: true,
  },
  {
    id: '2',
    slug: 'infection-control',
    title: 'Infection Control for CNAs',
    summary: 'Mandatory infection prevention and PPE for California CNAs.',
    categorySlug: 'infection-control',
    categoryName: 'Infection Control',
    ceHours: 1,
    price: SINGLE_COURSE_PRICE,
    isFree: false,
    durationMinutes: 60,
    difficulty: 'beginner',
    instructor: 'CAL ACE Faculty',
    featured: true,
    hasFreePreview: true,
  },
  {
    id: '3',
    slug: 'resident-rights',
    title: 'Resident Rights & Advocacy',
    summary: 'Federal and California resident rights for long-term care.',
    categorySlug: 'cna-renewal',
    categoryName: 'CNA Renewal',
    ceHours: 1,
    price: SINGLE_COURSE_PRICE,
    isFree: false,
    durationMinutes: 60,
    difficulty: 'beginner',
    instructor: 'Dr. Maria Chen, RN',
    featured: true,
    hasFreePreview: true,
  },
  {
    id: '4',
    slug: 'mobility-safety',
    title: 'Mobility & Transfer Safety',
    summary: 'Safe transfers, fall prevention, and body mechanics.',
    categorySlug: 'professional-development',
    categoryName: 'Professional Development',
    ceHours: 1,
    price: SINGLE_COURSE_PRICE,
    isFree: false,
    durationMinutes: 60,
    difficulty: 'beginner',
    instructor: 'CAL ACE Faculty',
    featured: false,
    hasFreePreview: true,
  },
  {
    id: '5',
    slug: 'stress-management',
    title: 'Stress Management for Healthcare Workers',
    summary: 'Burnout awareness and resilience for CNAs.',
    categorySlug: 'professional-development',
    categoryName: 'Professional Development',
    ceHours: 1,
    price: SINGLE_COURSE_PRICE,
    isFree: false,
    durationMinutes: 60,
    difficulty: 'beginner',
    instructor: 'Dr. Maria Chen, RN',
    featured: false,
    hasFreePreview: false,
  },
  {
    id: '6',
    slug: 'communication-skills',
    title: 'Communication Skills in Long-Term Care',
    summary: 'Therapeutic communication and team collaboration.',
    categorySlug: 'professional-development',
    categoryName: 'Professional Development',
    ceHours: 1,
    price: 0,
    isFree: true,
    durationMinutes: 60,
    difficulty: 'intermediate',
    instructor: 'Dr. Maria Chen, RN',
    featured: true,
    hasFreePreview: true,
  },
];

export async function fetchCatalogCourses(params?: {
  search?: string;
  category?: string;
}): Promise<CatalogCourse[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category && params.category !== 'all') query.set('category', params.category);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const qs = query.toString();

  try {
    const response = await fetch(`${apiUrl}/api/catalog/courses${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
    });
    if (!response.ok) return PLACEHOLDER_CATALOG;
    return (await response.json()) as CatalogCourse[];
  } catch {
    return filterCatalog(PLACEHOLDER_CATALOG, params);
  }
}

export function filterCatalog(
  courses: CatalogCourse[],
  params?: { search?: string; category?: string },
) {
  let result = courses;
  if (params?.category && params.category !== 'all') {
    result = result.filter((c) => c.categorySlug === params.category);
  }
  if (params?.search?.trim()) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q),
    );
  }
  return result;
}
