export type AiApprovalStatus = 'pending_review' | 'instructor_approved' | 'rejected';

export type ComplianceReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export type CmsAiGenerationMeta = {
  source: string;
  promptVersion: string;
  model: string | null;
  generatedAt: string;
  generatedByUserId?: string;
  approvalStatus: AiApprovalStatus;
  complianceReviewStatus?: ComplianceReviewStatus;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewerDisplayName?: string;
  reviewNotes?: string;
  sourceReferences?: { id: string; label: string; status: string; note: string }[];
};

export const COMPLIANCE_REVIEW_LABELS: Record<ComplianceReviewStatus, string> = {
  pending: 'Compliance review pending',
  in_review: 'Compliance review in progress',
  approved: 'Compliance review approved',
  rejected: 'Compliance review rejected',
};

export type CmsAiSafetyItem = {
  id: string;
  label: string;
  status: string;
  note: string;
};

export type CmsMediaPrompts = {
  infographicIdeas?: string[];
  imagePrompts?: { blockHint: string; prompt: string }[];
  miniVideoScripts?: { title: string; durationLabel: string; script: string }[];
  downloadableHandouts?: { title: string; description: string }[];
  narrationScripts?: { blockHint: string; script: string }[];
  accessibilityCaptionNotes?: string[];
  forumDiscussionPrompts?: string[];
};

export const AI_APPROVAL_LABELS: Record<AiApprovalStatus, string> = {
  pending_review: 'Pending instructor review',
  instructor_approved: 'Instructor approved',
  rejected: 'Rejected — revise before publish',
};
