export type TranscriptDeliveryMode = 'online' | 'in-person' | 'hybrid';

export interface TranscriptCourseEntry {
  courseTitle: string;
  completedOn: Date | string;
  ceHours: number | string;
  deliveryMode?: TranscriptDeliveryMode;
  certificateNo?: string;
  certificateHref?: string;
}

export interface TranscriptLearnerInfo {
  name: string;
  email: string;
}

export interface TranscriptTotalsData {
  /** Defaults to completed course count when omitted. */
  totalOnlineCeUnits?: number;
}

export interface TranscriptDisplayData {
  learner: TranscriptLearnerInfo;
  generatedAt: Date | string;
  courses: TranscriptCourseEntry[];
  totals?: TranscriptTotalsData;
}

export interface TranscriptProps extends TranscriptDisplayData {
  /** Legal institution name — defaults to CAL ACE legal entity. */
  institutionLegalName?: string;
  /** Operating brand line — defaults to CAL ACE Nursing Academy. */
  institutionBrandName?: string;
  logoSrc?: string;
  logoFallbackSrc?: string | string[];
  className?: string;
}
