import { apiFetch } from './api';
import type { LearnerSupportTicket, SupportTicketStatus } from './support';

export type AdminDashboard = {
  totalLearners: number;
  activeEnrollments: number;
  completedCourses: number;
  issuedCertificates: number;
  totalOnlineCeuHoursIssued: number;
  examPassRate: number | null;
  examAttemptsGraded: number;
  seatTimeComplianceRate: number | null;
  seatTimeTrackedEnrollments: number;
  revenue: {
    totalRevenue: number;
    paidOrderCount: number;
    subscriptionCount: number;
    refunds: number;
    failedPayments: number;
    stripeStatus: string;
    currency: string;
  };
  support: {
    openTickets: number;
    escalationQueue: number;
    placeholder: boolean;
  };
};

export type AdminEnrolledStudent = {
  userId: string;
  fullName: string;
  email: string;
  enrollmentCount: number;
  plans: string[];
  latestEnrolledAt: string | null;
};

export type AdminEnrolledStudentsResponse = {
  totalEnrolledStudents: number;
  totalEnrollments: number;
  students: AdminEnrolledStudent[];
  page: number;
  pageSize: number;
  pageCount: number;
  matchingStudents?: number;
  matchingEnrollments?: number;
};

export type AdminLearnerListItem = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  enrollmentCount: number;
  certificateCount: number;
};

export type AdminLearnerDetail = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  roles: string[];
  profile: {
    jurisdiction: string | null;
    profession: string | null;
    onboardingComplete: boolean;
  } | null;
  enrollments: {
    id: string;
    status: string;
    enrolledAt: string;
    courseSlug: string;
    courseTitle: string;
    ceHours: number;
    progressPct: number;
    completion: {
      status: string;
      ceHoursEarned: number;
      completedAt: string;
    } | null;
  }[];
  certificates: {
    id: string;
    certificateNo: string;
    status: string;
    issuedAt: string | null;
    verificationCode: string | null;
    courseTitle: string;
    learnerName: string | null;
    onlineCeuHours: unknown;
    onlineCeuHoursLabel: unknown;
  }[];
  transcript: {
    id: string;
    title: string;
    ceHours: number;
    completedOn: string;
    entryType: string;
  }[];
  compliance: unknown;
};

export type AdminExamAttemptSummary = {
  id: string;
  attemptNum: number;
  status: string;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  course: { slug: string; title: string };
  exam: { slug: string; title: string };
};

export type AdminExamAttemptDetail = AdminExamAttemptSummary & {
  questions: {
    questionId: string;
    prompt: string | null;
    options: { id: string; label: string | null }[];
    learnerAnswer: string | string[] | null;
    learnerAnswerLabels: string[];
    correct: boolean | null;
    pointsEarned: number | null;
    pointsPossible: number | null;
    correctAnswerSummary: string | null;
    explanation: string | null;
  }[];
};

export type AdminCourseOps = {
  courseId: string;
  slug: string;
  title: string;
  status: string;
  ceHours: number;
  publishedVersion?: number;
  enrollmentCount: number;
  completionCount: number;
  averageProgressPct: number;
  examPassRate: number | null;
  seatTimeComplianceRate: number | null;
};

export type AdminCourseDetail = {
  courseId: string;
  slug: string;
  title: string;
  status: string;
  ceHours: number;
  versions: {
    versionId: string;
    versionNumber: number;
    status: string;
    enrollmentCount: number;
    completionCount: number;
    averageProgressPct: number;
    examPassRate: number | null;
    seatTimeComplianceRate: number | null;
  }[];
};

export type AdminCertificateListItem = {
  id: string;
  certificateNo: string;
  status: string;
  publicVerificationStatus: 'Valid' | 'Revoked' | 'Archived';
  issuedAt: string | null;
  revokedAt: string | null;
  learnerEmail: string;
  learnerName: string;
  courseTitle: string;
  courseSlug: string;
  ceHours: number;
  onlineCeuHoursLabel: string;
  onlineDelivery: boolean;
  verificationUrl: string;
  verificationTokenStatus: string | null;
  warnings: string[];
};

export type AdminCertificateDetail = AdminCertificateListItem & {
  verificationToken: {
    id: string;
    status: string;
    revokedAt: string | null;
    metadata: unknown;
  } | null;
  payload: Record<string, unknown>;
};

export type AdminCertificatesResponse = {
  certificates: AdminCertificateListItem[];
  complianceWarnings: { type: string; message: string; certificateId: string }[];
};

export async function getAdminCertificateDetail(certificateId: string) {
  return apiFetch<AdminCertificateDetail>(`/admin/certificates/${certificateId}`);
}

export async function revokeAdminCertificate(certificateId: string) {
  return apiFetch<AdminCertificateDetail>(`/admin/certificates/${certificateId}/revoke`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function restoreAdminCertificate(certificateId: string) {
  return apiFetch<AdminCertificateDetail>(`/admin/certificates/${certificateId}/restore`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function archiveAdminCertificate(certificateId: string) {
  return apiFetch<AdminCertificateDetail>(`/admin/certificates/${certificateId}/archive`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export type CorrectLegalNameRequest = {
  firstName: string;
  lastName: string;
  reason: string;
  idVerified: boolean;
  applyToCertificateIds?: string[];
};

export type CorrectLegalNameResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  certificatesCorrected: Array<{
    id: string;
    certificateNo: string;
    learnerName: string;
  }>;
  certificatesSkipped: Array<{ id: string; reason: string }>;
};

export async function correctAdminLearnerName(userId: string, body: CorrectLegalNameRequest) {
  return apiFetch<CorrectLegalNameResponse>(`/admin/learners/${userId}/correct-name`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type AdminAuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  category: string;
  actorEmail: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AdminRevenue = {
  totalRevenue: number;
  paidOrderCount: number;
  refunds: number;
  failedPayments: number;
  subscriptionCount: number;
  subscriptionsByStatus: { status: string; count: number }[];
  stripeStatus: string;
  stripeNote: string;
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    learnerEmail: string;
    placedAt: string;
  }[];
  placeholder: boolean;
};

export type AdminSupportTicket = LearnerSupportTicket & {
  learnerEmail: string;
};

export type AdminSupport = {
  openTickets: number;
  urgentOpenTickets: number;
  recentTickets: AdminSupportTicket[];
};

export type ProviderComplianceSettings = {
  providerName: string;
  nacProviderReference: string;
  providerContactEmail: string;
  providerContactPhone: string;
  providerContactAddress: string;
  supportContactEmail: string;
  supportContactUrl: string;
  recordRetentionPolicyText: string;
  certificateWordingTemplate: string;
  attestationText: string;
  showApprovalStatusToLearners: boolean;
  cdphOnlineApproved: boolean;
  courseApprovalStatusLabel: string;
  defaultInstructorName: string;
  defaultCeHoursPerCourse: number;
  minutesPerOnlineCeuHour: number;
  internalAuditExportNote: string;
};

export type AdminComplianceSettingsResponse = {
  settings: ProviderComplianceSettings;
  internalOnly: {
    auditExportArchitecture: string;
    recordRetentionPolicyText: string;
    internalAuditExportNote: string;
  };
};

export type AuditCategory =
  | 'all'
  | 'login'
  | 'enrollment'
  | 'participation'
  | 'exam'
  | 'attestation'
  | 'certificate';

export type AdminUnlimitedMember = {
  userId: string;
  fullName: string;
  email: string;
  membershipStatus: string;
  purchaseDate: string | null;
  expiresAt: string | null;
  eligibility: 'eligible' | 'verify';
  verifyReason?: string;
};

export type AdminUnlimitedMembersLookup = {
  query: string;
  result: 'eligible' | 'not_eligible';
  reason?:
    | 'no_matching_member'
    | 'not_paid'
    | 'mock'
    | 'inactive'
    | 'expired'
    | 'refunded_or_cancelled';
};

export type AdminUnlimitedMembersResponse = {
  promo: {
    planCode: string;
    discountAmountCents: number;
    campusName: string;
    enabled: boolean;
  };
  members: AdminUnlimitedMember[];
  lookup?: AdminUnlimitedMembersLookup;
};

export type AdminUnlimited1yMembersResponse = {
  members: AdminUnlimitedMember[];
  lookup?: AdminUnlimitedMembersLookup;
};

export async function updateAdminSupportTicket(
  ticketId: string,
  input: { status: SupportTicketStatus; staffNote?: string },
) {
  return apiFetch<AdminSupportTicket>(`/admin/support/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function patchAdminComplianceSettings(
  settings: Partial<ProviderComplianceSettings>,
) {
  return apiFetch<{ settings: ProviderComplianceSettings }>('/admin/compliance/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}
