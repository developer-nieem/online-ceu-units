export type CertificateRecord = {
  id: string;
  certificateNo: string;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  courseSlug: string | null;
  courseTitle: string;
  ceuHours: number;
  onlineCeuHoursLabel?: string;
  learnerName: string;
  completedAt: string;
  verificationCode: string;
  verifyToken: string | null;
  verificationUrl?: string;
  publicVerificationStatus?: 'Valid' | 'Revoked' | 'Archived';
  payload: Record<string, unknown>;
  download: { status: string; note: string };
};

export type TranscriptEntryRecord = {
  id: string;
  entryType: string;
  title: string;
  ceHours: number;
  onlineCeuHoursLabel?: string;
  completedOn: string;
  sourceRef: string | null;
  certificateId?: string;
  certificateNo?: string;
  verificationCode?: string;
  verificationAvailable?: boolean;
  verificationUrl?: string;
  renewalPeriodId?: string;
  categorySlug?: string;
  courseSlug: string | null;
  createdAt: string;
  immutable: boolean;
};

export type TranscriptResponse = {
  entries: TranscriptEntryRecord[];
  totalCeHours: number;
  count: number;
  groupedByRenewalPeriod: Array<{
    renewalPeriodId: string;
    label: string;
    totalCeHours: number;
    entryCount: number;
    entries: TranscriptEntryRecord[];
  }>;
  download: { status: string; note: string };
  immutableNotice: string;
};

export type ComplianceSummary = {
  status: string;
  statusLabel: string;
  jurisdiction: { code: string; name: string };
  profession: { code: string; name: string };
  renewalPeriod: {
    id: string;
    label: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    requiredHours: number;
    earnedHours: number;
    remainingHours: number;
    pctComplete: number;
    daysUntilExpiration: number;
  };
  licenseExpiresOn: string | null;
  mandatoryTopics: string[];
  topicWarnings: Array<{ topic: string; message: string; severity: string }>;
  inServiceCategories: Array<{ slug: string; label: string; required: boolean }>;
  categoryBreakdown: Array<{ slug: string; label: string; hours: number }>;
  provider: {
    name: string;
    /** CDPH Provider NAC reference from tenant provider settings (e.g. NAC-7384). */
    nacProviderReference: string | null;
    contactSummary: string | null;
    supportContact: string | null;
    approvalStatusLabel: string | null;
  };
  supportContact?: string | null;
  snapshotId: string;
  asOfDate: string;
  warnings: unknown[];
  yearSplit?: {
    year1: {
      periodStart: string;
      periodEnd: string;
      earnedHours: number;
      requiredHours: number;
      met: boolean;
    };
    year2: {
      periodStart: string;
      periodEnd: string;
      earnedHours: number;
      requiredHours: number;
      met: boolean;
    };
  };
  onlineCap?: {
    onlineHours: number;
    inPersonHours: number;
    maxOnlineHours: number;
    capExceeded: boolean;
    onlineHoursApplied: number;
    effectiveHours: number;
    honestyNote: string;
  };
};
