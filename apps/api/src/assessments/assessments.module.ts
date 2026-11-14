import { Module } from '@nestjs/common';



import { AuthModule } from '../auth/auth.module';

import { CredentialsModule } from '../credentials/credentials.module';

import { ParticipationModule } from '../participation/participation.module';

import { AssessmentController } from './assessment.controller';

import { AssessmentScoringService } from './assessment-scoring.service';

import { AssessmentService } from './assessment.service';

import { CompletionEligibilityService } from './completion-eligibility.service';
import { MilestoneBadgeService } from './milestone-badge.service';



@Module({

  imports: [AuthModule, CredentialsModule, ParticipationModule],

  controllers: [AssessmentController],

  providers: [

    AssessmentService,

    AssessmentScoringService,

    CompletionEligibilityService,

    MilestoneBadgeService,

  ],

  exports: [AssessmentService, CompletionEligibilityService],

})

export class AssessmentsModule {}


