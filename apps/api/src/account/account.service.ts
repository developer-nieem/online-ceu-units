import { Injectable, NotFoundException } from '@nestjs/common';
import { CertificateStatus, Prisma, TranscriptEntryType } from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { SUPPORT_EMAIL_PLACEHOLDER } from '../notifications/notification-preferences.types';
import { PrismaService } from '../prisma/prisma.service';
import {
  computeCaliforniaRenewalProgress,
  TRANSCRIPT_COMPLETION_FILTER,
} from './california-renewal-progress';
import type {
  AccountProfileEditable,
  AccountProfileResponse,
  LearnerProfileDataV1,
} from './account-profile.types';
import type { UpdateAccountProfileDto } from './dto/update-account-profile.dto';
import { resolveLearnerCityConsent } from './learner-city-consent';

const DEFAULT_TIMEZONE = 'America/Los_Angeles';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(user: AuthUser): Promise<AccountProfileResponse> {
    const dbUser = await this.requireUser(user);
    const profile = await this.ensureLearnerProfile(user);
    return this.buildResponse(user.userId, dbUser, profile);
  }

  async updateProfile(
    user: AuthUser,
    dto: UpdateAccountProfileDto,
  ): Promise<AccountProfileResponse> {
    const dbUser = await this.requireUser(user);
    const profile = await this.ensureLearnerProfile(user);
    const profileData = this.parseProfileData(profile.profileData);

    const userUpdate: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) {
      userUpdate.firstName = this.normalizeOptionalString(dto.firstName);
    }
    if (dto.lastName !== undefined) {
      userUpdate.lastName = this.normalizeOptionalString(dto.lastName);
    }

    if (dto.preferredDisplayName !== undefined) {
      profileData.preferredDisplayName = this.normalizeOptionalString(dto.preferredDisplayName);
    }
    if (dto.cnaIssuingState !== undefined) {
      profileData.cnaIssuingState = this.normalizeOptionalString(dto.cnaIssuingState);
    }

    const profileUpdate: Prisma.LearnerProfileUpdateInput = {
      profileData: profileData as Prisma.InputJsonValue,
    };

    if (dto.cnaLicenseNumber !== undefined) {
      profileUpdate.licenseNumber = this.normalizeOptionalString(dto.cnaLicenseNumber);
    }
    if (dto.timezone !== undefined) {
      const tz = this.normalizeOptionalString(dto.timezone);
      profileUpdate.timezone = tz ?? DEFAULT_TIMEZONE;
    }
    if (dto.cnaRenewalDueDate !== undefined) {
      const due = this.normalizeOptionalString(dto.cnaRenewalDueDate);
      profileUpdate.licenseExpiresOn = due ? this.parseDateOnly(due) : null;
    }
    if (dto.cnaEffectiveDate !== undefined) {
      const eff = this.normalizeOptionalString(dto.cnaEffectiveDate);
      profileUpdate.licenseEffectiveOn = eff ? this.parseDateOnly(eff) : null;
    }
    if (dto.hhaCertificateNumber !== undefined) {
      profileData.hhaCertificateNumber = this.normalizeOptionalString(dto.hhaCertificateNumber);
    }
    if (dto.hhaEffectiveDate !== undefined) {
      profileData.hhaEffectiveDate = this.normalizeOptionalString(dto.hhaEffectiveDate);
    }
    if (dto.hhaExpirationDate !== undefined) {
      profileData.hhaExpirationDate = this.normalizeOptionalString(dto.hhaExpirationDate);
    }
    if (dto.birthMonth !== undefined) {
      profileUpdate.birthMonth = dto.birthMonth ?? null;
    }
    if (dto.birthDay !== undefined) {
      profileUpdate.birthDay = dto.birthDay ?? null;
    }

    Object.assign(
      profileUpdate,
      resolveLearnerCityConsent({
        city:
          dto.city === undefined ? undefined : (this.normalizeOptionalString(dto.city) ?? null),
        cityConsentGiven: dto.cityConsentGiven,
        existingConsent: profile.cityConsentGiven,
      }),
    );

    const [updatedUser, updatedProfile] = await this.prisma.$transaction([
      Object.keys(userUpdate).length
        ? this.prisma.user.update({ where: { id: user.userId }, data: userUpdate })
        : this.prisma.user.findUniqueOrThrow({ where: { id: user.userId } }),
      this.prisma.learnerProfile.update({
        where: { id: profile.id },
        data: profileUpdate,
      }),
    ]);

    return this.buildResponse(user.userId, updatedUser, updatedProfile);
  }

  private async requireUser(user: AuthUser) {
    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.userId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }
    return dbUser;
  }

  private async ensureLearnerProfile(user: AuthUser) {
    const existing = await this.prisma.learnerProfile.findUnique({
      where: { userId: user.userId },
    });
    if (existing) return existing;

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const jurisdiction = await this.prisma.jurisdiction.findFirst({
      where: { code: 'US-CA', deletedAt: null },
      select: { id: true },
    });
    const profession = await this.prisma.profession.findFirst({
      where: { code: 'CNA', deletedAt: null },
      select: { id: true },
    });

    return this.prisma.learnerProfile.create({
      data: {
        userId: user.userId,
        tenantId: user.tenantId,
        jurisdictionId: jurisdiction?.id,
        professionId: profession?.id,
        timezone: DEFAULT_TIMEZONE,
        profileData: {},
      },
    });
  }

  private parseProfileData(raw: Prisma.JsonValue): LearnerProfileDataV1 {
    const data =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as LearnerProfileDataV1)
        : {};
    return {
      preferredDisplayName: this.normalizeOptionalString(data.preferredDisplayName) ?? null,
      cnaIssuingState: this.normalizeOptionalString(data.cnaIssuingState) ?? null,
      hhaCertificateNumber: this.normalizeOptionalString(data.hhaCertificateNumber) ?? null,
      hhaEffectiveDate: this.normalizeOptionalString(data.hhaEffectiveDate) ?? null,
      hhaExpirationDate: this.normalizeOptionalString(data.hhaExpirationDate) ?? null,
    };
  }

  /** PATCH may send explicit nulls; never call string methods on non-strings. */
  private normalizeOptionalString(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseDateOnly(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) {
      return new Date(value);
    }
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month, day));
  }

  private formatDateOnly(date: Date | null | undefined): string | null {
    if (!date) return null;
    try {
      return date.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }

  private async buildResponse(
    userId: string,
    user: { email: string; firstName: string | null; lastName: string | null; createdAt: Date },
    profile: {
      licenseNumber: string | null;
      licenseExpiresOn: Date | null;
      licenseEffectiveOn: Date | null;
      timezone: string | null;
      profileData: Prisma.JsonValue;
      updatedAt: Date;
      birthMonth: number | null;
      birthDay: number | null;
      city: string | null;
      cityConsentGiven: boolean | null;
    },
  ): Promise<AccountProfileResponse> {
    const profileData = this.parseProfileData(profile.profileData);
    const [completedCeHours, certificatesEarned, transcriptEntries] = await Promise.all([
      this.sumCompletedCeHours(userId),
      this.countCertificates(userId),
      this.listCompletionEntries(userId),
    ]);

    const renewalProgress = computeCaliforniaRenewalProgress({
      entries: transcriptEntries,
      effectiveDate: profile.licenseEffectiveOn,
      renewalDueDate: profile.licenseExpiresOn,
      memberSince: user.createdAt,
    });

    const editable: AccountProfileEditable = {
      firstName: user.firstName,
      lastName: user.lastName,
      preferredDisplayName: profileData.preferredDisplayName ?? null,
      cnaLicenseNumber: profile.licenseNumber,
      cnaIssuingState: profileData.cnaIssuingState ?? null,
      cnaRenewalDueDate: this.formatDateOnly(profile.licenseExpiresOn),
      cnaEffectiveDate: this.formatDateOnly(profile.licenseEffectiveOn),
      timezone: profile.timezone ?? DEFAULT_TIMEZONE,
      hhaCertificateNumber: profileData.hhaCertificateNumber ?? null,
      hhaEffectiveDate: profileData.hhaEffectiveDate ?? null,
      hhaExpirationDate: profileData.hhaExpirationDate ?? null,
      birthMonth: profile.birthMonth ?? null,
      birthDay: profile.birthDay ?? null,
      city: profile.city ?? null,
      cityConsentGiven: profile.cityConsentGiven,
    };

    return {
      editable,
      readOnly: {
        email: user.email,
        memberSince: user.createdAt.toISOString(),
        completedCeHours,
        certificatesEarned,
      },
      renewalProgress,
      supportEmail: SUPPORT_EMAIL_PLACEHOLDER,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private async listCompletionEntries(userId: string) {
    return this.prisma.transcriptEntry.findMany({
      where: { userId, ...TRANSCRIPT_COMPLETION_FILTER },
      select: { completedOn: true, ceHours: true, deliveryMode: true },
      orderBy: { completedOn: 'asc' },
    });
  }

  private async sumCompletedCeHours(userId: string): Promise<number> {
    const aggregate = await this.prisma.transcriptEntry.aggregate({
      where: { userId, entryType: TranscriptEntryType.COMPLETION },
      _sum: { ceHours: true },
    });
    return Math.round(Number(aggregate._sum.ceHours ?? 0) * 100) / 100;
  }

  private async countCertificates(userId: string): Promise<number> {
    return this.prisma.certificate.count({
      where: { userId, status: CertificateStatus.ISSUED },
    });
  }
}
