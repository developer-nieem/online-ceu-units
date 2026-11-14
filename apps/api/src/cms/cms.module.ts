import { Module } from '@nestjs/common';

import { CmsAiVideoService } from './ai/video.service';
import { CmsAiGenerationService } from './cms-ai-generation.service';
import { CmsAssessmentsService } from './cms-assessments.service';
import { CmsBlueprintService } from './cms-blueprint.service';
import { CourseFactoryController } from './course-factory.controller';
import { CourseFactoryService } from './course-factory.service';
import { CmsController } from './cms.controller';
import { CmsCoursesService } from './cms-courses.service';
import { CmsStructureService } from './cms-structure.service';

@Module({
  controllers: [CmsController, CourseFactoryController],
  providers: [
    CmsCoursesService,
    CmsStructureService,
    CmsAssessmentsService,
    CmsBlueprintService,
    CmsAiGenerationService,
    CmsAiVideoService,
    CourseFactoryService,
  ],
  exports: [
    CmsCoursesService,
    CmsBlueprintService,
    CmsAiGenerationService,
    CmsAiVideoService,
    CourseFactoryService,
  ],
})
export class CmsModule {}
