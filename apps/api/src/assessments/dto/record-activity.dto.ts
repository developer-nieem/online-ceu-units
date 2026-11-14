import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecordActivityDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  minutes?: number;
}
