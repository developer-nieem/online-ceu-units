import { Controller, Get, Query } from '@nestjs/common';
import { TranscriptEntryType } from '@calace/db';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { TranscriptService } from './transcript.service';

@Controller('transcript')
export class TranscriptController {
  constructor(private readonly transcript: TranscriptService) {}

  /** Enrollment-based academic transcript (same population as the learner /transcript page). */
  @Get('enrollments')
  listCompletedEnrollments(@CurrentUser() user: AuthUser) {
    return this.transcript.listCompletedEnrollmentsForUser(user);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('renewalPeriodId') renewalPeriodId?: string,
    @Query('entryType') entryType?: TranscriptEntryType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.transcript.listForUser(user, { q, renewalPeriodId, entryType, from, to });
  }
}
