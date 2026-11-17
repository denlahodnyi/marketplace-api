import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('demo')
export class DemoQueueConsumer extends WorkerHost {
  async process(
    job: Job<{ createdAt: string; failedAttempts: number }, any, string>,
  ): Promise<any> {
    switch (job.name) {
      case 'demo-job': {
        if (
          job.data.failedAttempts &&
          job.attemptsMade < job.data.failedAttempts
        ) {
          throw new Error(`Failed attempt #${job.attemptsMade + 1}`);
        }
        break;
      }
      case 'heartbeat': {
        break;
      }
      default: {
        throw new Error(`Unknown job`);
      }
    }
    return { success: true };
  }
}
