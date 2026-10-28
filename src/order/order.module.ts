import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../entities/order.entity.js';
import { OrderEventsService } from './order-events.service.js';
import { OrderController } from './order.controller.js';
import { OrderGateway } from './order.gateway.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrderGateway, OrderEventsService, OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
