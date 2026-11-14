import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  ceuHours: z
    .number({ error: 'CEU hours must be a number' })
    .min(1, 'CEU hours must be at least 1'),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createLessonSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required'),
  title: z.string().trim().min(1, 'Lesson title is required'),
  videoUrl: z.string().trim().optional(),
  requiredSeatTime: z
    .number({ error: 'Required seat time must be a number' })
    .min(1, 'Required seat time must be at least 1 minute'),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const createExamQuestionSchema = z.object({
  assessmentId: z.string().trim().min(1, 'Assessment ID is required'),
  courseId: z.string().trim().min(1, 'Course ID is required'),
  prompt: z.string().trim().min(1, 'Question text is required'),
  options: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Each option must have text'),
      }),
    )
    .length(4, 'Exactly 4 options are required'),
  correctOptionIndex: z
    .number({ error: 'Select the correct answer' })
    .int()
    .min(0, 'Select the correct answer')
    .max(3, 'Select the correct answer'),
  rationale: z.string().trim().min(1, 'Rationale is required for CDPH compliance'),
});

export type CreateExamQuestionInput = z.infer<typeof createExamQuestionSchema>;
