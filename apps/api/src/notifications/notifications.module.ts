import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminMessagingController } from './admin-messaging.controller';
import { AdminMessagingService } from './admin-messaging.service';
import { LearnerNotificationsService } from './learner-notifications.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationEmitterService } from './notification-emitter.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReminderEngineService } from './reminder-engine.service';
import { UnsubscribeController } from './unsubscribe.controller';
import { UnsubscribeService } from './unsubscribe.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NotificationsController, AdminMessagingController, UnsubscribeController],
  providers: [
    NotificationsService,
    LearnerNotificationsService,
    NotificationDeliveryService,
    NotificationEmitterService,
    AdminMessagingService,
    ReminderEngineService,
    UnsubscribeService,
  ],
  exports: [
    NotificationsService,
    LearnerNotificationsService,
    NotificationDeliveryService,
    NotificationEmitterService,
    ReminderEngineService,
    UnsubscribeService,
  ],
})
export class NotificationsModule {}
