import { SupportTicketPriority } from '@calace/db';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateSupportTicketDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(3, { message: 'Subject must be at least 3 characters.' })
  @MaxLength(160, { message: 'Subject must be 160 characters or fewer.' })
  subject!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters.' })
  @MaxLength(5000, { message: 'Message must be 5000 characters or fewer.' })
  message!: string;

  @IsEnum(SupportTicketPriority, { message: 'Choose a valid priority.' })
  priority!: SupportTicketPriority;
}
