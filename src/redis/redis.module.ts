import { createClient } from '@keyv/redis';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/index.js';

export const REDIS_CACHE_CLIENT = 'REDIS_CACHE_CLIENT';
export const REDIS_JOBS_CLIENT = 'REDIS_JOBS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CACHE_CLIENT,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Env, true>) => {
        const redisUrl = configService.get('REDIS_URL', { infer: true });
        const client = createClient({ url: redisUrl });
        client.on('error', function (e) {
          console.error(`REDIS: Error connecting: "${e}"`);
        });
        try {
          await client?.connect?.();
        } catch (error) {
          console.error(`REDIS: Failed to connect: ${error}`);
        }
        await client.configSet({
          maxmemory: '6mb',
          ['maxmemory-policy']: 'allkeys-lru',
        });
        return client;
      },
    },
    {
      provide: REDIS_JOBS_CLIENT,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Env, true>) => {
        const redisUrl = configService.get('REDIS_JOBS_URL', { infer: true });
        const client = createClient({ url: redisUrl });
        client.on('error', function (e) {
          console.error(`REDIS-JOBS: Error connecting: "${e}"`);
        });
        try {
          await client?.connect?.();
        } catch (error) {
          console.error(`REDIS-JOBS: Failed to connect: ${error}`);
        }
        return client;
      },
    },
  ],
  exports: [REDIS_CACHE_CLIENT, REDIS_JOBS_CLIENT],
})
export class RedisModule {}
