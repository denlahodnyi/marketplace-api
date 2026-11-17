import type { RedisClientType } from 'redis';
import type { LogLevel } from 'typeorm';

import KeyvRedis from '@keyv/redis';
import {
  RedisThrottlerStorage,
  ThrottlerAlgorithm,
} from '@nestjs-redis/throttler-storage';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createNodeRedisClient } from 'bullmq';

import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CartModule } from './cart/cart.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { validateEnv, type Env } from './config/index.js';
import { dataSourceOptions } from './data-source.js';
import { DemoQueueConsumer } from './demo/redis/demo-queue-consumer.service.js';
import { DemoSchedulerService } from './demo/redis/demo-queue-scheduler.service.js';
import { ListingsModule } from './listing/listing.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { OrderModule } from './order/order.module.js';
import { OutboxModule } from './outbox/outbox.module.js';
import {
  REDIS_CACHE_CLIENT,
  REDIS_JOBS_CLIENT,
  RedisModule,
} from './redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => {
        const logLevel = configService.get('TYPE_ORM_LOG_LEVEL', {
          infer: true,
        });
        const dbUrl = configService.get('DB_URL', { infer: true });
        const testDbUrl = configService.get('TEST_DB_URL', { infer: true });
        if (testDbUrl) {
          console.log('TEST_DB_URL was found and will be applied');
        }
        return {
          ...dataSourceOptions,
          logging: (logLevel?.split(',') as LogLevel[]) ?? false,
          logger: 'formatted-console',
          url: testDbUrl || dbUrl,
        };
      },
    }),
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [REDIS_CACHE_CLIENT],
      useFactory: async (redis: RedisClientType) => {
        const redisStore = new KeyvRedis(redis);
        redisStore.on('error', (err) => console.error('Redis error:', err));
        return {
          stores: [redisStore],
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, REDIS_JOBS_CLIENT],
      useFactory: async (
        configService: ConfigService<Env, true>,
        redis: RedisClientType,
      ) => {
        const ttl = configService.get('RATE_LIMIT_TTL', { infer: true });
        const limit = configService.get('RATE_LIMIT_LIMIT', { infer: true });
        return {
          throttlers: [{ limit: limit ?? 100, ttl: seconds(ttl ?? 60) }],
          storage: new RedisThrottlerStorage(
            redis,
            ThrottlerAlgorithm.SlidingWindowCounter,
          ),
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [REDIS_JOBS_CLIENT],
      useFactory: async (redis: RedisClientType) => {
        const connection = createNodeRedisClient(redis);
        return { connection, prefix: 'queue' };
      },
    }),
    BullModule.registerQueue({
      name: 'demo',
    }),
    ListingsModule,
    AdminModule,
    CartModule,
    CheckoutModule,
    OrderModule,
    NotificationModule,
    OutboxModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AppService,
    DemoQueueConsumer,
    DemoSchedulerService,
  ],
})
export class AppModule {}
