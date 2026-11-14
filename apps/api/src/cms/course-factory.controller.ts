import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { ROLE_SLUG } from '../config/auth.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CourseFactoryService } from './course-factory.service';
import { GenerateCourseDto } from './dto/generate-course.dto';

const CMS_ROLES = [ROLE_SLUG.ADMIN, ROLE_SLUG.INSTRUCTOR] as const;

@Controller('cms')
@Roles(...CMS_ROLES)
export class CourseFactoryController {
  constructor(private readonly factory: CourseFactoryService) {}

  @Post('generate')
  @UseGuards(CsrfGuard)
  generateCourse(@Body() dto: GenerateCourseDto, @CurrentUser() user: AuthUser) {
    return this.factory.generateCourse(dto, user);
  }
}
