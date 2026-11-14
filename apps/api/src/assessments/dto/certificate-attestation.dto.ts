import { IsBoolean } from 'class-validator';

export class CertificateAttestationDto {
  @IsBoolean()
  confirmed!: boolean;
}
