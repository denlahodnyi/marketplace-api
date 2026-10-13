import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnv, type Env } from './config/index.js';
import { dataSourceOptions } from './data-source.js';
import { ListingsModule } from './listing/listing.module.js';

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
        const dbUrl = configService.get('DB_URL', { infer: true });
        const testDbUrl = configService.get('TEST_DB_URL', { infer: true });
        if (testDbUrl) {
          console.log('TEST_DB_URL was found and will be applied');
        }
        return {
          ...dataSourceOptions,
          url: testDbUrl || dbUrl,
        };
      },
    }),
    ListingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
