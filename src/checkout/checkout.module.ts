import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';

import type { Env } from '../config/env.schema.js';

import { getRabbitMqConfig, RMQ_TOKENS } from '../rabbitmq-setup.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: RMQ_TOKENS.ordersNotifications,
        useFactory: async (configService: ConfigService<Env, true>) =>
          getRabbitMqConfig({
            connectionUrl: configService.get('RABBITMQ_URL'),
          }).ordersNotifications.producer,
      },
    ]),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
