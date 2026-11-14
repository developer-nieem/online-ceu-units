import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ProgressService } from '../progress/progress.service';
import { RecordBlockProgressDto } from './dto/record-block-progress.dto';
import { PlayerService } from './player.service';

@Controller('player')
export class PlayerController {
  constructor(
    private readonly player: PlayerService,
    private readonly progress: ProgressService,
  ) {}

  @Get('courses/:slug')
  getState(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
  ) {
    return this.player.getPlayerState(user, slug);
  }

  @Get('courses/:slug/lessons/:lessonSlug')
  getLessonState(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('lessonSlug') lessonSlug: string,
  ) {
    return this.player.getPlayerState(user, slug, lessonSlug);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:slug/lessons/:lessonSlug/complete')
  completeLesson(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Param('lessonSlug') lessonSlug: string,
    @Body() body: { enrollmentId: string; lessonId: string },
  ) {
    return this.progress.completeLesson(user, body.enrollmentId, body.lessonId);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:slug/lessons/:lessonSlug/view')
  viewLesson(
    @CurrentUser() user: AuthUser,
    @Body() body: { enrollmentId: string; lessonId: string },
  ) {
    return this.progress.recordLessonView(user, body.enrollmentId, body.lessonId);
  }

  @UseGuards(CsrfGuard)
  @Post('courses/:slug/lessons/:lessonSlug/block-progress')
  recordBlockProgress(
    @CurrentUser() user: AuthUser,
    @Body() dto: RecordBlockProgressDto,
  ) {
    const event =
      dto.eventType === 'block_viewed'
        ? { type: 'block_viewed' as const, blockId: dto.blockId }
        : dto.eventType === 'knowledge_check_answered'
          ? {
              type: 'knowledge_check_answered' as const,
              blockId: dto.blockId,
              selectedOptionId: dto.selectedOptionId!,
              correct: dto.correct ?? false,
            }
          : {
              type: 'interaction_completed' as const,
              blockId: dto.blockId,
              selectedOptionId: dto.selectedOptionId,
              correct: dto.correct,
              reflectionText: dto.reflectionText,
            };

    return this.progress.recordBlockProgress(
      user,
      dto.enrollmentId,
      dto.lessonId,
      event,
    );
  }
}
