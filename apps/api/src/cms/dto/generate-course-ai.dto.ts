import { IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class GenerateCourseAiDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  courseCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  ceHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categorySlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  stateJurisdiction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  profession?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  californiaRelevance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  toneFocus?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}

export class UpdateAiApprovalDto {
  @IsString()
  @Matches(/^(pending_review|instructor_approved|rejected)$/)
  approvalStatus!: 'pending_review' | 'instructor_approved' | 'rejected';

  @IsOptional()
  @IsString()
  @Matches(/^(pending|in_review|approved|rejected)$/)
  complianceReviewStatus?: 'pending' | 'in_review' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
