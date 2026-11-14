import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class ParticipationHeartbeatDto {
  @IsString()
  @MinLength(8)
  sessionId!: string;

  @IsInt()
  @Min(0)
  clientSequence!: number;

  @IsOptional()
  @IsISO8601()
  clientTimestamp?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  lessonSlug?: string;

  @IsBoolean()
  tabVisible!: boolean;

  @IsBoolean()
  documentFocused!: boolean;

  @IsBoolean()
  idle!: boolean;

  // Interactions accumulate between 30s heartbeats; scroll/pointer events can legitimately
  // produce many. 1000 is a sane abuse ceiling without rejecting honest activity.
  @IsInt()
  @Min(0)
  @Max(1000)
  interactionDelta!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scrollDepthPct?: number;

  /** Native HTML5 course video is currently playing (not paused/ended/seeking). */
  @IsOptional()
  @IsBoolean()
  videoPlaying?: boolean;

  /**
   * Native HTML5 course audio is currently playing (play/playing, not pause/ended).
   * Suppresses idle only. Hidden tab and window blur still pause accrual.
   */
  @IsOptional()
  @IsBoolean()
  audioPlaying?: boolean;
}
