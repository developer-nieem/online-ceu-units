import { CourseStatus } from '@calace/db';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  ceHours?: number;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsObject()
  catalogData?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  contentMeta?: Record<string, unknown>;
}
