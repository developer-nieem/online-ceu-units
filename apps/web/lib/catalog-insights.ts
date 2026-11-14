import type { CatalogCourse } from './catalog';
import { apiUrl } from './api-config';

export type TrendingCourse = CatalogCourse & {
  accessCount: number;
};

export type CatalogInsights = {
  trendingCourses: TrendingCourse[];
  topCities: Array<{ city: string; count: number }>;
  asOf: string;
};

const FALLBACK_INSIGHTS: CatalogInsights = {
  trendingCourses: [],
  topCities: [],
  asOf: new Date().toISOString(),
};

/** Same k as the API. Drops sub-threshold cities if a stale cached body is replayed. */
const CITY_AGGREGATE_MIN_COUNT = 5;

export async function getCatalogInsights(): Promise<CatalogInsights> {
  try {
    const res = await fetch(apiUrl('/catalog/insights'), { next: { revalidate: 300 } });
    if (!res.ok) return FALLBACK_INSIGHTS;
    const data = (await res.json()) as CatalogInsights;
    return {
      ...data,
      topCities: (data.topCities ?? []).filter((row) => row.count >= CITY_AGGREGATE_MIN_COUNT),
    };
  } catch {
    return FALLBACK_INSIGHTS;
  }
}
