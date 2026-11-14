import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CourseStatus } from '@calace/db';

import { ROLE_SLUG } from '../config/auth.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CmsAssessmentsService } from './cms-assessments.service';
import { CmsAiGenerationService } from './cms-ai-generation.service';
import { CmsBlueprintService } from './cms-blueprint.service';
import { CmsCoursesService } from './cms-courses.service';
import { CmsStructureService } from './cms-structure.service';
import {
  GenerateCourseAiDto,
  UpdateAiApprovalDto,
} from './dto/generate-course-ai.dto';
import {
  CreateCourseFromBlueprintDto,
  DuplicateCourseDto,
} from './dto/create-course-from-blueprint.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  CreateLessonDto,
  CreateModuleDto,
  ReorderLessonsDto,
  UpdateLessonContentDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/structure.dto';
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
} from './dto/assessment.dto';

const CMS_ROLES = [ROLE_SLUG.ADMIN, ROLE_SLUG.INSTRUCTOR] as const;

@Controller('cms')
@Roles(...CMS_ROLES)
export class CmsController {
  constructor(
    private readonly courses: CmsCoursesService,
    private readonly structure: CmsStructureService,
    private readonly assessments: CmsAssessmentsService,
    private readonly blueprint: CmsBlueprintService,
    private readonly aiGeneration: CmsAiGenerationService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.courses.getDashboard();
  }

  @Get('categories')
  categories() {
    return this.courses.listCategories();
  }

  @Get('courses')
  listCourses(
    @Query('status') status?: CourseStatus,
    @Query('search') search?: string,
  ) {
    return this.courses.listCourses({ status, search });
  }

  @Get('blueprints')
  listBlueprints() {
    return this.blueprint.listBlueprints();
  }

  @Get('ai/providers')
  listAiProviders() {
    return this.aiGeneration.listProviders();
  }

  @Post('courses/generate/preview')
  @UseGuards(CsrfGuard)
  previewCourseGeneration(@Body() dto: GenerateCourseAiDto) {
    return this.aiGeneration.previewGeneration(dto);
  }

  @Post('courses/generate')
  @UseGuards(CsrfGuard)
  generateCourseWithAi(
    @Body() dto: GenerateCourseAiDto,
    @CurrentUser() user: AuthUser,
  ): Promise<unknown> {
    return this.aiGeneration.generateCourse(dto, user.userId);
  }

  @Patch('courses/:courseId/ai-approval')
  @UseGuards(CsrfGuard)
  updateAiApproval(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateAiApprovalDto,
    @CurrentUser() user: AuthUser,
  ): Promise<unknown> {
    return this.aiGeneration.updateAiApproval(courseId, dto, user.userId);
  }

  @Post('courses/:courseId/generate-videos')
  @UseGuards(CsrfGuard)
  generateCourseVideos(@Param('courseId') courseId: string): Promise<unknown> {
    return this.aiGeneration.generateVideosForCourse(courseId);
  }

  @Post('courses')
  @UseGuards(CsrfGuard)
  createCourse(@Body() dto: CreateCourseDto): Promise<unknown> {
    return this.courses.createCourse(dto);
  }

  @Post('courses/from-blueprint')
  @UseGuards(CsrfGuard)
  createCourseFromBlueprint(@Body() dto: CreateCourseFromBlueprintDto): Promise<unknown> {
    return this.blueprint.createCourseFromBlueprint(dto);
  }

  @Post('courses/:courseId/duplicate')
  @UseGuards(CsrfGuard)
  duplicateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: DuplicateCourseDto,
  ): Promise<unknown> {
    return this.blueprint.duplicateCourseStructure(courseId, dto);
  }

  @Get('courses/:courseId/pacing')
  getCoursePacing(@Param('courseId') courseId: string) {
    return this.blueprint.getPacingReport(courseId);
  }

  @Get('courses/:courseId')
  getCourse(@Param('courseId') courseId: string): Promise<unknown> {
    return this.courses.getCourseDetail(courseId);
  }

  @Patch('courses/:courseId')
  @UseGuards(CsrfGuard)
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<unknown> {
    return this.courses.updateCourse(courseId, dto);
  }

  @Post('courses/:courseId/archive')
  @UseGuards(CsrfGuard)
  archiveCourse(@Param('courseId') courseId: string) {
    return this.courses.archiveCourse(courseId);
  }

  @Post('courses/:courseId/submit-review')
  @UseGuards(CsrfGuard)
  submitReview(@Param('courseId') courseId: string): Promise<unknown> {
    return this.courses.submitForReview(courseId);
  }

  @Post('courses/:courseId/versions')
  @UseGuards(CsrfGuard)
  createRevision(@Param('courseId') courseId: string, @Body() body: { label?: string }) {
    return this.courses.createDraftRevision(courseId, body.label);
  }

  @Post('courses/:courseId/versions/:versionId/publish')
  @UseGuards(CsrfGuard)
  publishVersion(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
  ): Promise<unknown> {
    return this.courses.publishVersion(courseId, versionId);
  }

  @Post('courses/:courseId/versions/:versionId/modules')
  @UseGuards(CsrfGuard)
  createModule(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
    @Body() dto: CreateModuleDto,
  ): Promise<unknown> {
    return this.structure.createModule(courseId, versionId, dto);
  }

  @Patch('modules/:moduleId')
  @UseGuards(CsrfGuard)
  updateModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ): Promise<unknown> {
    return this.structure.updateModule(moduleId, dto);
  }

  @Delete('modules/:moduleId')
  @UseGuards(CsrfGuard)
  deleteModule(@Param('moduleId') moduleId: string) {
    return this.structure.deleteModule(moduleId);
  }

  @Post('modules/:moduleId/lessons')
  @UseGuards(CsrfGuard)
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ): Promise<unknown> {
    return this.structure.createLesson(moduleId, dto);
  }

  @Get('lessons/:lessonId')
  getLesson(@Param('lessonId') lessonId: string): Promise<unknown> {
    return this.structure.getLesson(lessonId);
  }

  @Patch('lessons/:lessonId')
  @UseGuards(CsrfGuard)
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<unknown> {
    return this.structure.updateLesson(lessonId, dto);
  }

  @Put('lessons/:lessonId/content')
  @UseGuards(CsrfGuard)
  updateLessonContent(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonContentDto,
  ): Promise<unknown> {
    return this.structure.updateLessonContent(lessonId, dto);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(CsrfGuard)
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.structure.deleteLesson(lessonId);
  }

  @Post('lessons/reorder')
  @UseGuards(CsrfGuard)
  reorderLessons(@Body() dto: ReorderLessonsDto) {
    return this.structure.reorderLessons(dto);
  }

  @Get('courses/:courseId/versions/:versionId/assessments')
  listAssessments(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
  ): Promise<unknown> {
    return this.assessments.listForVersion(courseId, versionId);
  }

  @Post('courses/:courseId/versions/:versionId/assessments')
  @UseGuards(CsrfGuard)
  createAssessment(
    @Param('courseId') courseId: string,
    @Param('versionId') versionId: string,
    @Body() dto: CreateAssessmentDto,
  ): Promise<unknown> {
    return this.assessments.createAssessment(courseId, versionId, dto);
  }

  @Patch('assessments/:assessmentId')
  @UseGuards(CsrfGuard)
  updateAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() dto: UpdateAssessmentDto,
  ): Promise<unknown> {
    return this.assessments.updateAssessment(assessmentId, dto);
  }

  @Post('assessments/:assessmentId/questions')
  @UseGuards(CsrfGuard)
  createQuestion(
    @Param('assessmentId') assessmentId: string,
    @Body() dto: CreateQuestionDto,
  ): Promise<unknown> {
    return this.assessments.createQuestion(assessmentId, dto);
  }

  @Patch('questions/:questionId')
  @UseGuards(CsrfGuard)
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<unknown> {
    return this.assessments.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @UseGuards(CsrfGuard)
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.assessments.deleteQuestion(questionId);
  }
}
