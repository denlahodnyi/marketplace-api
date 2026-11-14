import { Inject, Injectable } from '@nestjs/common';
import { RmqRecordBuilder, type ClientProxy } from '@nestjs/microservices';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';
import { IsNull, DataSource, QueryRunner } from 'typeorm';

import { Outbox } from '../entities/outbox.entity.js';
import { RMQ_EVENTS, RMQ_TOKENS } from '../rabbitmq-setup.js';

const WORKERS = 3;
let CRASHED_RELAY_COUNT = 0;

@Injectable()
export class OutboxService {
  constructor(
    @Inject(RMQ_TOKENS.ordersNotifications)
    private readonly ordersNotificationsQueue: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  async relay() {
    return Promise.all(
      Array.from(
        { length: WORKERS },
        (_: any, i: number) => `worker-${i + 1}`,
      ).map(async () => {
        for (;;) {
          const client = this.dataSource.createQueryRunner();
          const task = await this.runRelay(client);
          if (task.success) {
            const left = await this.dataSource
              .getRepository(Outbox)
              .count({ where: { publishedAt: IsNull() } });
            if (!left) return;
            await setTimeout(50);
          }
        }
      }),
    );
  }

  async runRelay(client: QueryRunner) {
    await client.connect();

    try {
      await client.startTransaction();
      const outbox = await client.manager
        .getRepository(Outbox)
        .createQueryBuilder('outbox')
        .setLock('pessimistic_write') // <-- FOR UPDATE
        .setOnLocked('skip_locked')
        .where('outbox.published_at IS NULL')
        .orderBy('created_at, id')
        .limit(1)
        .getOne();

      if (!outbox) {
        await client.commitTransaction();
        return { success: true };
      }

      await lastValueFrom(this.publish(outbox.id, outbox.type, outbox.payload));

      if (
        process.env.ENABLE_CRASH_RELAY === 'true' &&
        CRASHED_RELAY_COUNT === 0
      ) {
        CRASHED_RELAY_COUNT++;
        throw new Error('Simulated crashed relay');
      }

      await client.manager.getRepository(Outbox).update(
        { id: outbox.id },
        {
          publishedAt: () => `now()`,
          attempts: () => `attempts + 1`,
        },
      );
      await client.commitTransaction();
      return { success: true };
    } catch {
      // TODO: handle error
      await client.rollbackTransaction();
      return { success: false };
    } finally {
      client.release();
    }
  }

  publish(messageId: string, key: string, payload: object) {
    const message = new RmqRecordBuilder(payload)
      .setOptions({ messageId, type: key })
      .build();
    if (key === RMQ_EVENTS.orderCreated) {
      return this.ordersNotificationsQueue.emit(key, message);
    }
    throw new Error(`Unknown key: ${key}`);
  }
}
