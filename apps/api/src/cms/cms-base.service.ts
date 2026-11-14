import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseVersionStatus, Prisma } from '@calace/db';

import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';
import { requiredActiveParticipationMinutes } from '../config/ceu-defaults';
import { PrismaService } from '../prisma/prisma.service';
import type { CmsCourseContentMeta } from './types/cms-metadata.types';

@Injectable()
export class CmsBaseService {
  constructor(protected readonly prisma: PrismaService) {}

  async getTenantId() {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');
    return tenant.id;
  }

  slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  async getCourseForTenant(courseIdOrSlug: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      },
      include: {
        category: true,
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          include: {
            _count: { select: { completions: true, enrollments: true } },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async getVersionForCourse(versionId: string, courseId: string) {
    const version = await this.prisma.courseVersion.findFirst({
      where: { id: versionId, courseId, deletedAt: null },
    });
    if (!version) throw new NotFoundException('Course version not found');
    return version;
  }

  async versionCompletionCount(versionId: string) {
    return this.prisma.completion.count({ where: { courseVersionId: versionId } });
  }

  async versionEnrollmentCount(versionId: string) {
    return this.prisma.enrollment.count({ where: { courseVersionId: versionId } });
  }

  /** Published versions with learner outcomes cannot be edited in place. */
  async assertDraftEditable(versionId: string) {
    const version = await this.prisma.courseVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException('Course version not found');
    if (version.status !== CourseVersionStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft versions can be edited. Create a draft revision to change published content.',
      );
    }
    const completions = await this.versionCompletionCount(versionId);
    if (completions > 0) {
      throw new ForbiddenException(
        'This draft version already has completions and cannot be modified.',
      );
    }
  }

  mergeComplianceSeatTime(
    contentMeta: CmsCourseContentMeta,
    ceHours: number,
  ): CmsCourseContentMeta {
    const compliance = { ...contentMeta.compliance };
    if (compliance.requiredSeatTimeMinutes == null) {
      compliance.requiredSeatTimeMinutes = requiredActiveParticipationMinutes(ceHours);
    }
    return { ...contentMeta, compliance };
  }
}
