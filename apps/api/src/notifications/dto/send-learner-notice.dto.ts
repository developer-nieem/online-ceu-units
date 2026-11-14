import { IsString, MinLength } from 'class-validator';

export class SendLearnerNoticeDto {
  @IsString()
  userId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  message!: string;
}
