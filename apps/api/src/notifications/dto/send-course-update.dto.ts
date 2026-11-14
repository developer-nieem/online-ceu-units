import { IsString, MinLength } from 'class-validator';

export class SendCourseUpdateDto {
  @IsString()
  courseId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  message!: string;
}
