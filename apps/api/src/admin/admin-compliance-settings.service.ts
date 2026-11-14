import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import type { ProviderComplianceSettings } from '../provider-compliance/provider-compliance.settings';
import { AdminBaseService } from './admin-base.service';

/** Admin-only tenant compliance configuration (not CDPH application package UI). */
@Injectable()
export class AdminComplianceSettingsService extends AdminBaseService {
  constructor(
    prisma: PrismaService,
    private readonly providerSettings: ProviderComplianceSettingsService,
  ) {
    super(prisma);
  }

  async getSettings() {
    const tenantId = await this.getTenantId();
    const settings = await this.providerSettings.getForTenant(tenantId);
    return {
      settings,
      internalOnly: {
        auditExportArchitecture:
          'Future: admin-only exports via AuditLog + Completion + Certificate tables. No public CDPH package routes.',
        recordRetentionPolicyText: settings.recordRetentionPolicyText,
        internalAuditExportNote: settings.internalAuditExportNote,
      },
    };
  }

  async updateSettings(patch: Partial<ProviderComplianceSettings>) {
    const tenantId = await this.getTenantId();
    const settings = await this.providerSettings.updateForTenant(tenantId, patch);
    return { settings };
  }
}
