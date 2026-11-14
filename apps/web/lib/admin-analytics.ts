export type TrendPoint = { week: string; count: number };

export type AdminAnalytics = {
  generatedAt: string;
  overview: {
    totalLearners: number;
    activeLearners7d: number;
    activeLearners30d: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completions: number;
    issuedCertificates: number;
    totalCeHoursIssued: number;
    averageExamPassRate: number | null;
    averageExamScore: number | null;
    seatTimeCompletionRate: number | null;
    activeParticipationRate: number | null;
    courseCompletionRate: number | null;
    learnerRetentionRate: number | null;
    learnerRetentionNote: string;
    scannedEnrollments: number;
    enrollmentScanCapped: boolean;
  };
  trends: {
    enrollments: TrendPoint[];
    completions: TrendPoint[];
    certificates: TrendPoint[];
    examPasses: TrendPoint[];
  };
  courses: {
    items: {
      courseId: string;
      slug: string;
      title: string;
      ceHours: number;
      enrollments: number;
      completions: number;
      dropOffRate: number | null;
      averageProgressPct: number;
      averageSeatTimeMinutes: number | null;
      averageExamScore: number | null;
      examPassRate: number | null;
      examFailRate: number | null;
      participationAnomalies: { placeholder: boolean; note: string };
    }[];
    mostPopular: AdminAnalytics['courses']['items'];
    mostMissedQuestions: {
      questionId: string;
      prompt: string;
      missCount: number;
      courses: string[];
    }[];
  };
  learners: {
    recentlyActive: {
      id: string;
      email: string;
      name: string;
      lastLoginAt: string | null;
    }[];
    atRisk: {
      userId: string;
      enrollmentId: string;
      email: string;
      name: string;
      courseTitle: string;
      progressPct: number;
      enrolledAt: string;
    }[];
    repeatedFailures: {
      userId: string;
      email: string;
      name: string;
      courseTitle: string;
      failureCount: number;
      lastAttemptAt: string | null;
    }[];
    suspiciousParticipation: { placeholder: boolean; items: unknown[]; note: string };
    incompleteAttestation: { placeholder: boolean; count: number; note: string };
  };
  participation: {
    enrollmentsWithLedger: number;
    averageActiveMinutes: number | null;
    averageInteractionCount: number | null;
    seatTimeComplianceRate: number | null;
    activeVsIdleNote: string;
    averageCompletionDays: number | null;
    averageCompletionDaysNote: string;
    examUnlockTrend: TrendPoint[];
  };
  certificates: {
    issuedTotal: number;
    totalCeHoursIssued: number;
    byCourse: { courseTitle: string; count: number; ceHours: number }[];
    onlineCeDistribution: { hours: number; count: number }[];
    verificationUsage: { placeholder: boolean; verifyEvents: number; note: string };
  };
  activityTimeline: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actorEmail: string;
    createdAt: string;
    category: string;
  }[];
  placeholders: Record<string, string>;
  topCities: { city: string; count: number }[];
};
