import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CorrectLearnerNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @IsBoolean()
  idVerified!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applyToCertificateIds?: string[];
}
