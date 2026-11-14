import { apiFetch } from './api';

export type CmsDashboard = {
  total: number;
  published: number;
  draft: number;
  review: number;
  archived: number;
};

export type CmsCategory = { id: string; slug: string; name: string };

export type CmsCourseListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  status: string;
  ceHours: number;
  category: { slug: string; name: string } | null;
  catalogData: Record<string, unknown>;
  latestVersion: {
    id: string;
    versionNumber: number;
    status: string;
    completionCount: number;
    enrollmentCount: number;
  } | null;
  publishedVersionId: string | null;
  updatedAt: string;
};

export type CmsCourseDetail = CmsCourseListItem & {
  contentMeta: Record<string, unknown>;
  versions: {
    id: string;
    versionNumber: number;
    label: string | null;
    status: string;
    ceHours: number;
    publishedAt: string | null;
    immutableAfterPublish: boolean;
  }[];
  editableVersionId: string;
  editableVersionNumber: number;
  structure: CmsModuleOutline[];
};

export type CmsModuleOutline = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: string;
  lessons: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    sortOrder: number;
    status: string;
    durationMinutes: number | null;
  }[];
};

export type CmsLessonDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: string;
  durationMinutes: number | null;
  content: unknown;
  course: { id: string; slug: string; title: string };
  courseVersionId: string;
  moduleId: string;
  editable: boolean;
};

export type CmsAssessment = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  passingScore: number | null;
  maxAttempts: number | null;
  settings: unknown;
  questionCount: number;
  questions: {
    id: string;
    sortOrder: number;
    type: string;
    prompt: string;
    options: unknown;
    correctAnswer: unknown;
    explanation: string | null;
    metadata: unknown;
  }[];
};

export async function fetchCmsDashboard() {
  return apiFetch<CmsDashboard>('/cms/dashboard');
}

export async function fetchCmsCategories() {
  return apiFetch<CmsCategory[]>('/cms/categories');
}

export async function fetchCmsCourses(params?: { status?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return apiFetch<CmsCourseListItem[]>(`/cms/courses${qs ? `?${qs}` : ''}`);
}

export async function fetchCmsCourse(courseId: string) {
  return apiFetch<CmsCourseDetail>(`/cms/courses/${courseId}`);
}

export type CmsBlueprintSummary = {
  id: string;
  version: string;
  label: string;
  description: string;
  targetCeHours: number;
  targetActiveParticipationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  pacing: { valid: boolean; warnings: string[] };
};

export type CmsQualityChecklistItem = {
  id: string;
  label: string;
  status: string;
  note: string;
};

export type CmsPacingReport = {
  blueprintId: string;
  blueprintVersion?: string;
  blueprintLabel: string;
  targetActiveMinutes: number;
  minimumActiveMinutes: number;
  estimatedActiveMinutes: number;
  catalogDurationMinutes: number;
  blueprintPacing: {
    valid: boolean;
    meetsMinimumParticipation: boolean;
    estimatedActiveMinutes: number;
    weightedParticipationMinutes: number;
    warnings: string[];
  };
  durationCheck: {
    valid: boolean;
    warnings: string[];
    totalActiveMinutes: number;
    meetsMinimum: boolean;
  };
  qualityChecklist?: CmsQualityChecklistItem[];
  lessons: { slug: string; title: string; durationMinutes: number | null }[];
};

export async function fetchCmsBlueprints() {
  return apiFetch<CmsBlueprintSummary[]>('/cms/blueprints');
}

export type AiProviderInfo = { id: string; label: string; available: boolean };

export type CourseGenerationPreview = {
  title: string;
  slug?: string;
  courseCode?: string;
  summary: string;
  overview: string;
  learningObjectives: string[];
  keyTerms: string[];
  lessonOutline: {
    moduleTitle: string;
    moduleSlug: string;
    lessons: { slug: string; title: string; sectionKind: string; estimatedActiveMinutes: number }[];
  }[];
  exam: {
    title: string;
    draftQuestionCount: number;
    targetBankSize: number;
    questionTypes: Record<string, number>;
    samplePrompts: string[];
  };
  pacing: {
    estimatedActiveMinutes: number;
    targetActiveMinutes: number;
    meetsMinimum: boolean;
    warnings: string[];
  };
  safetyReviewCount: number;
  mediaPromptCount: number;
  courseThumbnailPrompt?: string;
  providerId: string;
  promptVersion: string;
  governanceNotice: string;
};

export type GenerateCourseAiBody = {
  title: string;
  courseCode?: string;
  slug?: string;
  targetAudience?: string;
  ceHours?: number;
  categorySlug?: string;
  categoryLabel?: string;
  stateJurisdiction?: string;
  profession?: string;
  shortDescription?: string;
  californiaRelevance?: string;
  toneFocus?: string;
  categoryId?: string;
};

export type GenerateCourseAiResponse = {
  courseId: string;
  slug: string;
  providerId: string;
  durationMs: number;
  lessonCount: number;
  questionCount: number;
  approvalStatus: string;
  complianceReviewStatus: string;
  preview: CourseGenerationPreview;
  message: string;
  detail: CmsCourseDetail;
  generatedByUserId: string;
};

export async function fetchAiProviders() {
  return apiFetch<AiProviderInfo[]>('/cms/ai/providers');
}

export async function previewCmsCourseGeneration(body: GenerateCourseAiBody) {
  return apiFetch<{
    preview: CourseGenerationPreview;
    durationMs: number;
    governanceNotice: string;
  }>('/cms/courses/generate/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function generateCmsCourseWithAi(body: GenerateCourseAiBody) {
  return apiFetch<GenerateCourseAiResponse>('/cms/courses/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCmsAiApproval(
  courseId: string,
  body: {
    approvalStatus: 'pending_review' | 'instructor_approved' | 'rejected';
    complianceReviewStatus?: 'pending' | 'in_review' | 'approved' | 'rejected';
    reviewNotes?: string;
  },
) {
  return apiFetch<CmsCourseDetail>(`/cms/courses/${courseId}/ai-approval`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function createCmsCourse(body: {
  title: string;
  slug?: string;
  summary?: string;
  categoryId?: string;
  ceHours?: number;
}) {
  return apiFetch<CmsCourseDetail>('/cms/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function createCmsCourseFromBlueprint(body: {
  title: string;
  slug?: string;
  summary?: string;
  blueprintId?: string;
  ceHours?: number;
}) {
  return apiFetch<CmsCourseDetail>('/cms/courses/from-blueprint', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function duplicateCmsCourse(
  sourceCourseId: string,
  body: { title: string; slug?: string; summary?: string },
) {
  return apiFetch<{ courseId: string; slug: string; lessonCount: number; detail: CmsCourseDetail }>(
    `/cms/courses/${sourceCourseId}/duplicate`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function fetchCmsPacingReport(courseId: string) {
  return apiFetch<CmsPacingReport>(`/cms/courses/${courseId}/pacing`);
}

export async function updateCmsCourse(
  courseId: string,
  body: Record<string, unknown>,
) {
  return apiFetch<CmsCourseDetail>(`/cms/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function publishCmsVersion(courseId: string, versionId: string) {
  return apiFetch<CmsCourseDetail>(
    `/cms/courses/${courseId}/versions/${versionId}/publish`,
    { method: 'POST', body: '{}' },
  );
}

export async function submitCmsCourseReview(courseId: string) {
  return apiFetch<CmsCourseDetail>(`/cms/courses/${courseId}/submit-review`, {
    method: 'POST',
    body: '{}',
  });
}

export async function createCmsRevision(courseId: string, label?: string) {
  return apiFetch<{ versionId: string; versionNumber: number; created: boolean }>(
    `/cms/courses/${courseId}/versions`,
    { method: 'POST', body: JSON.stringify({ label }) },
  );
}

export async function fetchCmsLesson(lessonId: string) {
  return apiFetch<CmsLessonDetail>(`/cms/lessons/${lessonId}`);
}

export async function updateCmsLessonContent(lessonId: string, content: unknown) {
  return apiFetch(`/cms/lessons/${lessonId}/content`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function createCmsLesson(
  moduleId: string,
  body: { title: string; slug?: string; durationMinutes?: number },
) {
  return apiFetch(`/cms/modules/${moduleId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCmsModule(
  moduleId: string,
  body: { title: string },
) {
  return apiFetch(`/cms/modules/${moduleId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function fetchCmsAssessments(courseId: string, versionId: string) {
  return apiFetch<CmsAssessment[]>(
    `/cms/courses/${courseId}/versions/${versionId}/assessments`,
  );
}

export async function createCmsQuestion(
  assessmentId: string,
  body: Record<string, unknown>,
) {
  return apiFetch(`/cms/assessments/${assessmentId}/questions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCmsQuestion(
  questionId: string,
  body: Record<string, unknown>,
) {
  return apiFetch(`/cms/questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
