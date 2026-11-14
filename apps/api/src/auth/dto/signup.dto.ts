import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  cnaLicenseNumber!: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  referredByCode?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsBoolean()
  cityConsentGiven?: boolean;

  @IsBoolean()
  @Equals(true)
  termsAccepted!: boolean;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
