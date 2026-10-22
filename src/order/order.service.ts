import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../entities/order.entity.js';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  getOrder(orderId: string) {
    return this.orderRepo.findOne({ where: { orderId } });
  }

  async changeStatus(orderId: string, status: Order['status']) {
    const result = await this.orderRepo.update(
      { orderId },
      { status },
      { returning: ['orderId', 'status'] },
    );
    return {
      orderId: result.raw[0].order_id,
      status: result.raw[0].status,
    };
  }
}
