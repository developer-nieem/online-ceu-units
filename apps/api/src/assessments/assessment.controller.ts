import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AssessmentService } from './assessment.service';
import { CertificateAttestationDto } from './dto/certificate-attestation.dto';
import { SaveAnswersDto } from './dto/save-answers.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessments: AssessmentService) {}

  @Get('courses/:courseSlug/completion-eligibility')
  completionEligibility(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.assessments.getCompletionEligibility(user, courseSlug);
  }

  @Get('courses/:courseSlug/final-exam')
  finalExamOverview(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.assessments.getFinalExamOverview(user, courseSlug);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:courseSlug/final-exam/attempts')
  startFinalExam(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.assessments.startFinalExamAttempt(user, courseSlug);
  }

  @Get('courses/:courseSlug/final-exam/attempts/in-progress')
  resumeFinalExam(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.assessments.resumeFinalExamAttempt(user, courseSlug);
  }

  @UseGuards(CsrfGuard)
  @Post('attempts/:attemptId/submit')
  submitAttempt(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.assessments.submitAttempt(user, attemptId, dto.answers);
  }

  @UseGuards(CsrfGuard)
  @Patch('attempts/:attemptId/answers')
  saveAnswers(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveAnswersDto,
  ) {
    return this.assessments.saveAttemptAnswers(user, attemptId, dto.answers);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:courseSlug/acknowledge-participation')
  acknowledgeParticipation(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.assessments.acknowledgeActiveParticipation(user, courseSlug);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:courseSlug/attest-certificate-release')
  attestCertificateRelease(
    @CurrentUser() user: AuthUser,
    @Param('courseSlug') courseSlug: string,
    @Body() dto: CertificateAttestationDto,
  ) {
    return this.assessments.attestCertificateRelease(user, courseSlug, dto.confirmed);
  }
}
