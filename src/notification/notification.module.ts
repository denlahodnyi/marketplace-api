import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationDelivery } from '../entities/notification-deliveries.entity.js';
import { Notification } from '../entities/notification.entity.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationDelivery])],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
