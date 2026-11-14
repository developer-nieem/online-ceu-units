import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { ROLE_SLUG } from '../config/auth.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AdminAuditService, type AuditCategory } from './admin-audit.service';
import { AdminComplianceSettingsService } from './admin-compliance-settings.service';
import type { ProviderComplianceSettings } from '../provider-compliance/provider-compliance.settings';
import { AdminCoursesService } from './admin-courses.service';
import { AdminCredentialsService } from './admin-credentials.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminLearnersService } from './admin-learners.service';
import { AdminMembersService } from './admin-members.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminSupportService } from './admin-support.service';
import { EnrollmentService } from '../enrollments/enrollment.service';
import { CorrectLearnerNameDto } from './dto/correct-learner-name.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Controller('admin')
@Roles(ROLE_SLUG.ADMIN)
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly learners: AdminLearnersService,
    private readonly members: AdminMembersService,
    private readonly courses: AdminCoursesService,
    private readonly credentials: AdminCredentialsService,
    private readonly audit: AdminAuditService,
    private readonly support: AdminSupportService,
    private readonly complianceSettings: AdminComplianceSettingsService,
    private readonly analytics: AdminAnalyticsService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  @Get('analytics')
  getAnalytics(): Promise<unknown> {
    return this.analytics.getAnalytics();
  }

  @Get('compliance/settings')
  getComplianceSettings(): Promise<unknown> {
    return this.complianceSettings.getSettings();
  }

  @Patch('compliance/settings')
  patchComplianceSettings(
    @Body() body: Partial<ProviderComplianceSettings>,
  ): Promise<unknown> {
    return this.complianceSettings.updateSettings(body);
  }

  @Get('dashboard')
  getDashboard(): Promise<unknown> {
    return this.dashboard.getOverview();
  }

  @Get('enrolled-students')
  listEnrolledStudents(
    @Query('search') search?: string,
    @Query('page') page?: string,
  ): Promise<unknown> {
    return this.learners.listEnrolledStudents({
      search,
      page: page ? Number(page) : undefined,
    });
  }

  @Get('learners')
  listLearners(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<unknown> {
    return this.learners.listLearners({
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('learners/:userId')
  getLearner(@Param('userId') userId: string): Promise<unknown> {
    return this.learners.getLearnerDetail(userId);
  }

  @Get('learners/:userId/exam-attempts')
  listExamAttempts(@Param('userId') userId: string): Promise<unknown> {
    return this.learners.listExamAttempts(userId);
  }

  @Get('learners/:userId/exam-attempts/:attemptId')
  getExamAttempt(
    @Param('userId') userId: string,
    @Param('attemptId') attemptId: string,
  ): Promise<unknown> {
    return this.learners.getExamAttempt(userId, attemptId);
  }

  @Patch('learners/:userId/correct-name')
  correctLearnerName(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CorrectLearnerNameDto,
  ): Promise<unknown> {
    return this.learners.correctLegalName(userId, user, dto);
  }

  @Get('courses')
  listCourses(): Promise<unknown> {
    return this.courses.listCourseOperations();
  }

  @Get('courses/:courseId')
  getCourse(@Param('courseId') courseId: string): Promise<unknown> {
    return this.courses.getCourseOperations(courseId);
  }

  @Get('certificates')
  listCertificates(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<unknown> {
    return this.credentials.listCertificates({
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('certificates/:certificateId')
  getCertificate(@Param('certificateId') certificateId: string): Promise<unknown> {
    return this.credentials.getCertificateDetail(certificateId);
  }

  @Post('certificates/:certificateId/revoke')
  revokeCertificate(
    @Param('certificateId') certificateId: string,
    @CurrentUser() user: AuthUser,
    @Body() body?: { reason?: string },
  ): Promise<unknown> {
    return this.credentials.revokeCertificate(certificateId, user, body?.reason);
  }

  @Post('certificates/:certificateId/restore')
  restoreCertificate(
    @Param('certificateId') certificateId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<unknown> {
    return this.credentials.restoreCertificate(certificateId, user);
  }

  @Post('certificates/:certificateId/archive')
  archiveCertificate(
    @Param('certificateId') certificateId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<unknown> {
    return this.credentials.archiveCertificate(certificateId, user);
  }

  @Get('audit')
  listAudit(
    @Query('category') category?: AuditCategory,
    @Query('limit') limit?: string,
  ): Promise<unknown> {
    return this.audit.listAuditLog({
      category: category ?? 'all',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('members/unlimited-1y')
  listUnlimited1yMembers(@Query('search') search?: string): Promise<unknown> {
    return this.members.listUnlimited1yMembers({ search });
  }

  @Get('members/unlimited')
  listUnlimitedMembers(@Query('search') search?: string): Promise<unknown> {
    return this.members.listUnlimitedMembers({ search });
  }

  @Get('revenue')
  getRevenue(): Promise<unknown> {
    return this.support.getRevenuePlaceholder();
  }

  @Get('support')
  getSupport(): Promise<unknown> {
    return this.support.getSupportQueue();
  }

  @Patch('support/:ticketId')
  @UseGuards(CsrfGuard)
  updateSupportTicket(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateSupportTicketDto,
  ): Promise<unknown> {
    return this.support.updateTicket(ticketId, dto);
  }

  @Post('enrollments/retry-pending-certificates')
  async retryPendingCertificates(@CurrentUser() user: AuthUser) {
    return this.enrollmentService.retryPendingCertificates(user.tenantId);
  }
}
