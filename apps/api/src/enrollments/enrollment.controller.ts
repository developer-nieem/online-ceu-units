import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { TrackViewDto } from './dto/track-view.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollments: EnrollmentService) {}

  @Get('my')
  listMine(@CurrentUser() user: AuthUser) {
    return this.enrollments.listMyEnrollments(user);
  }

  @Get('recently-viewed')
  recentlyViewed(@CurrentUser() user: AuthUser) {
    return this.enrollments.getRecentlyViewed(user);
  }

  @Get('course/:slug')
  forCourse(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.enrollments.getEnrollmentForCourse(user, slug);
  }

  @UseGuards(CsrfGuard)
  @Post()
  enroll(@CurrentUser() user: AuthUser, @Body() dto: CreateEnrollmentDto) {
    return this.enrollments.enroll(user, dto);
  }

  @UseGuards(CsrfGuard)
  @Post('track-view')
  trackView(@CurrentUser() user: AuthUser, @Body() body: TrackViewDto) {
    return this.enrollments.recordRecentView(user, body.courseSlug);
  }

  @UseGuards(CsrfGuard)
  @Post('course/:slug/restart')
  restartCourse(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.enrollments.restartCourse(user, slug);
  }

  @UseGuards(CsrfGuard)
  @Patch(':id/progress')
  updateProgress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.enrollments.updateProgress(user, id, dto);
  }
}
