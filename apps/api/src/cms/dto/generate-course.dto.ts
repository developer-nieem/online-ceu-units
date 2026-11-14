import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class GenerateCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  courseTitle!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  topicDescription!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  ceHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  regulatoryContext?: string;

  @IsOptional()
  @IsIn(['mock', 'anthropic', 'openai'])
  providerId?: 'mock' | 'anthropic' | 'openai';
}
