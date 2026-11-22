import type { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AppService } from './app.service.js';
import { IsPublic } from './auth/public.decorator.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectQueue('demo') private readonly demoQueue: Queue,
  ) {
    this.startTime = Date.now();
  }

  startTime?: number;

  // TODO: remove this in future
  @IsPublic()
  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @IsPublic()
  @Get('health')
  health() {
    return { ok: true, uptimeSec: (Date.now() - (this.startTime ?? 0)) / 1000 };
  }

  @IsPublic()
  @Get('demo-queue')
  async addDemoJob(
    @Query('jobId') jobId: string,
    @Query('failedAttempts', new DefaultValuePipe(0), ParseIntPipe)
    failedAttempts: number,
  ) {
    const job = await this.demoQueue.add(
      'demo-job',
      { createdAt: new Date().toISOString(), failedAttempts },
      {
        jobId: jobId || randomUUID(),
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 1000,
          jitter: 0,
        },
        delay: 1000,
        removeOnComplete: false,
      },
    );
    return { id: job.id, data: job.data };
  }
}
