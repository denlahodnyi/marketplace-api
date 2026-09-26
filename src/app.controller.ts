import {
  Controller,
  Get,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import pg, { type Pool } from 'pg';
import { DataSource } from 'typeorm';

import { AppService } from './app.service.js';
import { type Env } from './config/index.js';
import { Listing } from './entities/listing.entity.js';

const SECRET_FILE = new URL('../secrets/db_password', import.meta.url);

@Controller()
export class AppController implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService<Env, true>,
    private readonly ds: DataSource,
  ) {
    this.startTime = Date.now();
  }

  pool?: Pool;
  startTime?: number;

  onModuleInit() {
    this.pool = new pg.Pool({
      connectionString: this.config.get('DB_URL'),
      user: 'app_user',
      password: async () => (await readFile(SECRET_FILE, 'utf8')).trim(),
      max: 3,
    });
    this.pool.on('error', (e) => console.error(e));
  }

  async onModuleDestroy() {
    return this.pool?.end();
  }

  @Get()
  async getHello() {
    const listing = await this.ds
      .getRepository(Listing)
      .findOne({ where: { status: 'active' } });
    console.log(`🚀 -> AppController -> getHello -> listing:`, listing);
    return this.appService.getHello();
  }

  @Get('db')
  async getDb() {
    const r = await this.pool?.query('SELECT current_user, now()::text AS now');
    console.log(r?.rows);
    return { uptimeSec: (Date.now() - (this.startTime ?? 0)) / 1000 };
  }

  @Get('health')
  health() {
    return { ok: true, uptimeSec: (Date.now() - (this.startTime ?? 0)) / 1000 };
  }
}
