import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ParticipationHeartbeatDto } from './dto/participation-heartbeat.dto';
import { ParticipationService } from './participation.service';

@Controller('participation')
export class ParticipationController {
  constructor(private readonly participation: ParticipationService) {}

  @Get('courses/:courseSlug/status')
  status(@CurrentUser() user: AuthUser, @Param('courseSlug') courseSlug: string) {
    return this.participation.getComplianceStatus(user, courseSlug);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:courseSlug/heartbeat')
  heartbeat(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
    @Body() dto: ParticipationHeartbeatDto,
  ) {
    return this.participation.processHeartbeat(user, courseSlug, dto);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:courseSlug/dev-fast-forward')
  devFastForward(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.participation.devFastForwardSeatTime(user, courseSlug);
  }
}
