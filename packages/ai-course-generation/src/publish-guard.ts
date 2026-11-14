import type { AiGenerationRecord } from './types';

export type AiPublishGateMeta = Pick<AiGenerationRecord, 'approvalStatus' | 'generatedAt'>;

export function courseRequiresAiApproval(
  aiGeneration?: AiPublishGateMeta | null,
): aiGeneration is AiPublishGateMeta & { generatedAt: string } {
  return Boolean(aiGeneration?.generatedAt);
}

export function assertAiCoursePublishAllowed(aiGeneration?: AiPublishGateMeta | null): {
  allowed: boolean;
  reason?: string;
} {
  if (!courseRequiresAiApproval(aiGeneration)) {
    return { allowed: true };
  }
  if (aiGeneration.approvalStatus === 'instructor_approved') {
    return { allowed: true };
  }
  if (aiGeneration.approvalStatus === 'rejected') {
    return {
      allowed: false,
      reason: 'This AI-generated course was rejected. Revise content and mark instructor approved before publishing.',
    };
  }
  return {
    allowed: false,
    reason:
      'AI-generated courses require instructor approval before publish. Complete the AI review checklist and approve in CMS.',
  };
}
