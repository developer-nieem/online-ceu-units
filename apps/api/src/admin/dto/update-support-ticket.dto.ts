import { SupportTicketStatus } from '@calace/db';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSupportTicketDto {
  @IsEnum(SupportTicketStatus, { message: 'Choose a valid ticket status.' })
  status!: SupportTicketStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(5000, { message: 'Staff note must be 5000 characters or fewer.' })
  staffNote?: string;
}
