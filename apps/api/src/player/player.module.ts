import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EnrollmentModule } from '../enrollments/enrollment.module';
import { ParticipationModule } from '../participation/participation.module';
import { ProgressModule } from '../progress/progress.module';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

@Module({
  imports: [AuthModule, ProgressModule, ParticipationModule, EnrollmentModule],
  controllers: [PlayerController],
  providers: [PlayerService],
})
export class PlayerModule {}
