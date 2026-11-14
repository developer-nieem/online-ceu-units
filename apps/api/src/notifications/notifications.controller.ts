import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateNotificationPreferencesDto } from './notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.getInAppNotifications(user.tenantId, user.userId);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.notifications.getUnreadInAppCount(user.tenantId, user.userId);
    return { count };
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthUser) {
    return this.notifications.getNotificationPreferences(user.tenantId, user.userId);
  }

  @UseGuards(CsrfGuard)
  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notifications.updateNotificationPreferences(user.tenantId, user.userId, dto);
  }

  @UseGuards(CsrfGuard)
  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markInAppAsRead(user.tenantId, user.userId, id);
  }

  @UseGuards(CsrfGuard)
  @Patch(':id/archive')
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.archiveInApp(user.tenantId, user.userId, id);
  }
}
