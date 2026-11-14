import { IsString } from 'class-validator';

export class TrackViewDto {
  @IsString()
  courseSlug!: string;
}
