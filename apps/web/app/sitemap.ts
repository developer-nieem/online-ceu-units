import type { MetadataRoute } from 'next';

import { getCatalogCourses } from '@/lib/catalog-server';
import { PUBLIC_SITEMAP_PATHS, absoluteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/courses' || path === '/free' ? 0.9 : 0.7,
  }));

  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await getCatalogCourses();
    courseEntries = courses
      .filter((course) => !course.status || course.status === 'PUBLISHED')
      .map((course) => ({
        url: absoluteUrl(`/courses/${course.slug}`),
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    courseEntries = [];
  }

  return [...staticEntries, ...courseEntries];
}
