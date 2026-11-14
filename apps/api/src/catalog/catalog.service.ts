import { Injectable } from '@nestjs/common';

import {

  ContentPublishStatus,

  CourseStatus,

  CourseVersionStatus,

  Prisma,

} from '@calace/db';



import { rankCityAggregates } from '../account/learner-city-consent';
import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';

import { PrismaService } from '../prisma/prisma.service';
import { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import { catalogPriceFromData, isFreeFromCatalogData } from './catalog-pricing.util';
import { FREEMIUM_COURSE_SLUGS } from './catalog-insights.constants';



const SINGLE_COURSE_PRICE = 3.75;

/** Hide a city unless at least this many consenting learners share it. */
const CITY_AGGREGATE_MIN_COUNT = 5;



type CatalogData = {

  price?: number;

  durationMinutes?: number;

  displayDuration?: string;

  difficulty?: string;

  instructor?: string;

  featured?: boolean;

  hasFreePreview?: boolean;

  subscriptionEligible?: boolean;

};



type ContentMeta = {

  overview?: string;

  learningObjectives?: string[];

  faq?: { question: string; answer: string }[];

  compliance?: {

    providerName: string;

    approvalNote: string;

    licenseInfo: string;

  };

  imageAccent?: string;

  heroImage?: string;

};



@Injectable()

export class CatalogService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerSettings: ProviderComplianceSettingsService,
  ) {}



  private async getTenantId() {

    const tenant = await this.prisma.tenant.findFirst({

      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },

    });

    if (!tenant) throw new Error('Tenant not configured');

    return tenant.id;

  }



  private mapCourse(course: {

    id: string;

    slug: string;

    title: string;

    summary: string | null;

    status: CourseStatus;

    ceHours: Prisma.Decimal;

    catalogData: Prisma.JsonValue;

    category: { slug: string; name: string } | null;

  }) {

    const meta = (course.catalogData ?? {}) as CatalogData;
    const isFree = isFreeFromCatalogData(course.catalogData);

    return {

      id: course.id,

      slug: course.slug,

      title: course.title,

      status: course.status,

      summary: course.summary ?? '',

      categorySlug: course.category?.slug ?? 'general',

      categoryName: course.category?.name ?? 'General',

      ceHours: Number(course.ceHours),

      price: catalogPriceFromData(course.catalogData, SINGLE_COURSE_PRICE),

      isFree,

      durationMinutes: meta.durationMinutes ?? 60,

      displayDuration: meta.displayDuration ?? null,

      difficulty: meta.difficulty ?? 'beginner',

      instructor: meta.instructor ?? 'CAL ACE Faculty',

      featured: Boolean(meta.featured),

      hasFreePreview: Boolean(meta.hasFreePreview),

      subscriptionEligible: meta.subscriptionEligible !== false,

    };

  }



  async listCategories() {

    const tenantId = await this.getTenantId();

    const categories = await this.prisma.courseCategory.findMany({

      where: { tenantId, deletedAt: null },

      orderBy: { sortOrder: 'asc' },

      include: {

        _count: {

          select: {

            courses: { where: { status: CourseStatus.PUBLISHED, deletedAt: null } },

          },

        },

      },

    });



    return categories.map((cat) => ({

      slug: cat.slug,

      name: cat.name,

      description: cat.description,

      courseCount: cat._count.courses,

    }));

  }



  async listCourses(params: { search?: string; category?: string }) {

    const tenantId = await this.getTenantId();

    const where: Prisma.CourseWhereInput = {

      tenantId,

      status: {
        in: [CourseStatus.PUBLISHED, CourseStatus.DRAFT, CourseStatus.REVIEW],
      },

      deletedAt: null,

      ...(params.category && params.category !== 'all'

        ? { category: { slug: params.category } }

        : {}),

      ...(params.search

        ? {

            OR: [

              { title: { contains: params.search, mode: 'insensitive' } },

              { summary: { contains: params.search, mode: 'insensitive' } },

            ],

          }

        : {}),

    };



    const courses = await this.prisma.course.findMany({

      where,

      orderBy: { title: 'asc' },

      include: { category: true },

    });



    const mapped = courses.map((c) => this.mapCourse(c));

    return mapped.sort((a, b) => Number(b.featured) - Number(a.featured));

  }

  async getCatalogInsights() {
    const tenantId = await this.getTenantId();

    const [enrollmentRows, publishedCourses, cityRanking] = await Promise.all([
      this.prisma.enrollment.groupBy({
        by: ['courseVersionId'],
        where: { tenantId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.course.findMany({
        where: { tenantId, status: CourseStatus.PUBLISHED, deletedAt: null },
        include: {
          category: true,
          versions: {
            where: { status: CourseVersionStatus.PUBLISHED, deletedAt: null },
            orderBy: { versionNumber: 'desc' },
            take: 1,
            select: { id: true },
          },
        },
      }),
      this.prisma.learnerProfile.groupBy({
        by: ['city'],
        where: {
          tenantId,
          city: { not: null },
          cityConsentGiven: true,
        },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
      }),
    ]);

    const versionToCount = new Map(
      enrollmentRows.map((row) => [row.courseVersionId, row._count._all]),
    );

    const freemiumSet = new Set<string>(FREEMIUM_COURSE_SLUGS);

    const trendingCourses = publishedCourses
      .filter((course) => !freemiumSet.has(course.slug) && !isFreeFromCatalogData(course.catalogData))
      .map((course) => {
        const latestVersionId = course.versions[0]?.id;
        const accessCount =
          (latestVersionId ? versionToCount.get(latestVersionId) : 0) ?? 0;
        const mapped = this.mapCourse(course);
        return {
          ...mapped,
          accessCount,
        };
      })
      .sort((a, b) => b.accessCount - a.accessCount || Number(b.featured) - Number(a.featured))
      .slice(0, 10);

    const topCities = rankCityAggregates(
      cityRanking.map((r) => ({ city: r.city, count: r._count.city })),
      5,
      CITY_AGGREGATE_MIN_COUNT,
    );

    return {
      trendingCourses,
      topCities,
      asOf: new Date().toISOString(),
    };
  }

  async getCourseBySlug(slug: string) {

    const tenantId = await this.getTenantId();

    const course = await this.prisma.course.findFirst({

      where: { tenantId, slug, status: CourseStatus.PUBLISHED, deletedAt: null },

      include: {

        category: true,

        versions: {

          where: { status: CourseVersionStatus.PUBLISHED, deletedAt: null },

          orderBy: { versionNumber: 'desc' },

          take: 1,

          include: {

            modules: {

              where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },

              orderBy: { sortOrder: 'asc' },

              include: {

                lessons: {

                  where: { deletedAt: null, status: ContentPublishStatus.PUBLISHED },

                  orderBy: { sortOrder: 'asc' },

                },

              },

            },

          },

        },

      },

    });



    if (!course) return null;



    const base = this.mapCourse(course);

    const version = course.versions[0];

    const contentMeta = (version?.contentMeta ?? {}) as ContentMeta;
    const tenantSettings = await this.providerSettings.getForTenant(tenantId);
    const compliance = this.providerSettings.learnerCourseCompliance(
      tenantSettings,
      contentMeta,
      Number(course.ceHours),
    );



    return {

      ...base,

      courseVersionId: version?.id ?? null,

      overview: contentMeta.overview ?? course.summary ?? '',

      learningObjectives: contentMeta.learningObjectives ?? [],

      faq: contentMeta.faq ?? [],

      compliance,

      imageAccent: contentMeta.imageAccent ?? 'teal',

      heroImage: contentMeta.heroImage ?? null,

      modules: (version?.modules ?? []).map((mod) => ({

        id: mod.id,

        slug: mod.slug,

        title: mod.title,

        description: mod.description,

        sortOrder: mod.sortOrder,

        lessons: mod.lessons.map((lesson) => ({

          id: lesson.id,

          slug: lesson.slug,

          title: lesson.title,

          durationMinutes: lesson.durationMinutes,

          sortOrder: lesson.sortOrder,

        })),

      })),

    };

  }

}


