import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

const EVENT_TYPES = [
  'block_viewed',
  'interaction_completed',
  'knowledge_check_answered',
] as const;

export class RecordBlockProgressDto {
  @IsString()
  enrollmentId!: string;

  @IsString()
  lessonId!: string;

  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @IsString()
  blockId!: string;

  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @IsOptional()
  correct?: boolean;

  @IsOptional()
  @IsString()
  reflectionText?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
