import { Injectable } from '@nestjs/common';

import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';
import { formatOnlineCeuHours } from '../config/ceu-defaults';
import { PrismaService } from '../prisma/prisma.service';
import type { CmsComplianceMeta } from '../cms/types/cms-metadata.types';
import {
  DEFAULT_PROVIDER_COMPLIANCE_SETTINGS,
  mergeProviderComplianceSettings,
  PROVIDER_COMPLIANCE_SETTINGS_KEY,
  type ProviderComplianceSettings,
} from './provider-compliance.settings';

export type LearnerProviderDisplay = {
  name: string;
  /** CDPH Provider NAC number (e.g. NAC-7384); credentialing identity for learners. */
  nacProviderReference: string | null;
  contactSummary: string | null;
  supportContact: string | null;
  approvalStatusLabel: string | null;
};

export type LearnerCourseComplianceInfo = {
  providerName: string;
  providerContact: string | null;
  supportContact: string | null;
  approvalStatusLabel: string | null;
  completionRequirements: string[];
};

@Injectable()
export class ProviderComplianceSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForTenant(tenantId?: string): Promise<ProviderComplianceSettings> {
    const tenant = tenantId
      ? await this.prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
      : await this.prisma.tenant.findFirst({
          where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
        });
    if (!tenant) return { ...DEFAULT_PROVIDER_COMPLIANCE_SETTINGS };
    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    return mergeProviderComplianceSettings(settings[PROVIDER_COMPLIANCE_SETTINGS_KEY]);
  }

  async updateForTenant(
    tenantId: string,
    patch: Partial<ProviderComplianceSettings>,
  ): Promise<ProviderComplianceSettings> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not found');
    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const merged = mergeProviderComplianceSettings({
      ...mergeProviderComplianceSettings(settings[PROVIDER_COMPLIANCE_SETTINGS_KEY]),
      ...patch,
    });
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          [PROVIDER_COMPLIANCE_SETTINGS_KEY]: merged,
        },
      },
    });
    return merged;
  }

  formatCertificateHoursLabel(hours: number, settings: ProviderComplianceSettings): string {
    const template = settings.certificateWordingTemplate || '{{hours}} Online CE hour(s)';
    return template.replace('{{hours}}', String(hours)).replace(
      '{{hoursLabel}}',
      formatOnlineCeuHours(hours),
    );
  }

  learnerProviderDisplay(settings: ProviderComplianceSettings): LearnerProviderDisplay {
    const contactParts = [
      settings.providerContactEmail,
      settings.providerContactPhone,
      settings.providerContactAddress,
    ].filter(Boolean);
    const nac = settings.nacProviderReference?.trim() || null;
    return {
      name: settings.providerName,
      nacProviderReference: nac,
      contactSummary: contactParts.length > 0 ? contactParts.join(' · ') : null,
      supportContact: settings.supportContactEmail || settings.supportContactUrl || null,
      approvalStatusLabel: settings.showApprovalStatusToLearners
        ? settings.courseApprovalStatusLabel
        : null,
    };
  }

  learnerCourseCompliance(
    settings: ProviderComplianceSettings,
    courseMeta?: { compliance?: CmsComplianceMeta },
    ceHours = settings.defaultCeHoursPerCourse,
  ): LearnerCourseComplianceInfo {
    const courseCompliance = courseMeta?.compliance ?? {};
    const requiredSeat =
      courseCompliance.requiredSeatTimeMinutes ??
      Math.ceil(ceHours * settings.minutesPerOnlineCeuHour);

    const completionRequirements = [
      'Sign in with your learner account',
      `Complete interactive lesson content (${requiredSeat} minutes active participation for ${formatOnlineCeuHours(ceHours)})`,
      'Pass the final course exam',
      'Submit the learner attestation before your certificate is issued',
    ];

    const contactParts = [
      courseCompliance.providerName ?? settings.providerName,
      settings.providerContactEmail,
      settings.providerContactPhone,
    ].filter(Boolean);

    const showApproval =
      settings.showApprovalStatusToLearners &&
      (courseCompliance.cdphApprovalStatus === 'approved' ||
        courseCompliance.cdphApprovalStatus === 'placeholder');

    return {
      providerName: String(courseCompliance.providerName ?? settings.providerName),
      providerContact: contactParts.join(' · '),
      supportContact: settings.supportContactEmail || null,
      approvalStatusLabel: showApproval
        ? settings.courseApprovalStatusLabel
        : null,
      completionRequirements,
    };
  }

  certificateProviderFields(settings: ProviderComplianceSettings) {
    return {
      name: settings.providerName,
      contactEmail: settings.providerContactEmail,
      providerContactPhone: settings.providerContactPhone,
      providerContactAddress: settings.providerContactAddress,
      nacReference: settings.nacProviderReference,
      showApprovalToLearners: settings.showApprovalStatusToLearners,
      approvalStatusLabel: settings.courseApprovalStatusLabel,
    };
  }

  instructorDisplay(
    settings: ProviderComplianceSettings,
    catalogInstructor?: string | null,
  ) {
    return {
      name: catalogInstructor?.trim() || settings.defaultInstructorName,
    };
  }
}
