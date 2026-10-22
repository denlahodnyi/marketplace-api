import type { LogLevel } from 'typeorm';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CartModule } from './cart/cart.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { validateEnv, type Env } from './config/index.js';
import { dataSourceOptions } from './data-source.js';
import { ListingsModule } from './listing/listing.module.js';
import { OrderModule } from './order/order.module.js';

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
    ListingsModule,
    AdminModule,
    CartModule,
    CheckoutModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
