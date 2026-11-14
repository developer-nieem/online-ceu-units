import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { Announcement } from '@calace/db';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ROLE_SLUG } from '../config/auth.constants';
import { AdminMessagingService } from './admin-messaging.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { SendCourseUpdateDto } from './dto/send-course-update.dto';
import { SendLearnerNoticeDto } from './dto/send-learner-notice.dto';
import { ReminderEngineService } from './reminder-engine.service';

@Controller('admin/messaging')
@Roles(ROLE_SLUG.ADMIN)
export class AdminMessagingController {
  constructor(
    private readonly messaging: AdminMessagingService,
    private readonly reminders: ReminderEngineService,
  ) {}

  @Get('announcements')
  listAnnouncements(@CurrentUser() user: AuthUser): Promise<Announcement[]> {
    return this.messaging.listAnnouncements(user.tenantId);
  }

  @UseGuards(CsrfGuard)
  @Post('announcements')
  createAnnouncement(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAnnouncementDto,
  ): Promise<Announcement> {
    return this.messaging.createAnnouncement(user, {
      title: dto.title,
      message: dto.message,
      audience: dto.audience,
      courseId: dto.courseId,
      publish: dto.publish,
    });
  }

  @UseGuards(CsrfGuard)
  @Post('learner-notices')
  sendLearnerNotice(@CurrentUser() user: AuthUser, @Body() dto: SendLearnerNoticeDto) {
    return this.messaging.sendLearnerNotice(user, dto);
  }

  @UseGuards(CsrfGuard)
  @Post('course-updates')
  sendCourseUpdate(@CurrentUser() user: AuthUser, @Body() dto: SendCourseUpdateDto) {
    return this.messaging.sendCourseUpdate(user, dto);
  }

  @UseGuards(CsrfGuard)
  @Post('reminders/process')
  processReminders() {
    return this.reminders.processDueReminders();
  }

  @UseGuards(CsrfGuard)
  @Post('reminders/scan-attestation')
  scanAttestationReminders() {
    return this.reminders.scanAndScheduleAttestationReminders();
  }
}
