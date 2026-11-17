import type { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { addMinutes } from 'date-fns';

@Injectable()
export class DemoSchedulerService implements OnModuleInit {
  constructor(@InjectQueue('demo') private readonly demoQueue: Queue) {}
  async onModuleInit() {
    await this.demoQueue.upsertJobScheduler(
      'heartbeat',
      { every: 1500, endDate: addMinutes(new Date(), 1) },
      { name: 'heartbeat' },
    );
  }
}
