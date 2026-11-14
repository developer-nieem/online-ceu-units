import { Injectable } from '@nestjs/common';
import { Prisma } from '@calace/db';

import { DEFAULT_TENANT_SLUG, ROLE_SLUG } from '../config/auth.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminBaseService {
  constructor(protected readonly prisma: PrismaService) {}

  async getTenantId() {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');
    return tenant.id;
  }

  learnerUserWhere(tenantId: string): Prisma.UserWhereInput {
    return {
      tenantId,
      deletedAt: null,
      userRoles: { some: { role: { slug: ROLE_SLUG.LEARNER } } },
    };
  }
}
