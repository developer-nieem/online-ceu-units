import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { CreateCourseDto } from './create-course.dto';

export class CreateCourseFromBlueprintDto extends CreateCourseDto {
  @IsOptional()
  @IsString()
  @IsIn(['calace-one-hour-cna-ceu-v1'])
  blueprintId?: string;
}

export class DuplicateCourseDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  summary?: string;
}
