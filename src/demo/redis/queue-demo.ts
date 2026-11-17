import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import '@dotenvx/dotenvx/config';
import { createClient } from 'redis';

const JOB_ID = randomUUID();
const REPEATED_JOBS = 2;

const redisJobs = await createClient({ url: process.env.REDIS_JOBS_URL })
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();

const config = await redisJobs.configGet(['maxmemory', 'maxmemory-policy']);

const jobWithRetriesResp = await fetch(
  `http://localhost:3000/demo-queue?failedAttempts=${3}`,
);
const jobWithRetries = (await jobWithRetriesResp.json()) as {
  data: { id: number; data: object };
};
if (!jobWithRetries.data.id) throw new Error('Job without id');
console.log('Waiting all attempts...');
await setTimeout(10000); // 1s delay * 4 attempts + some headroom
const attempts = await redisJobs.hGet(
  `queue:demo:${jobWithRetries.data.id}`,
  'atm',
);

// Repeat with the same jobId to check deduplication
const repeatedJobs = await Promise.all(
  Array.from({ length: REPEATED_JOBS }, async (_, i) => {
    const resp = await fetch(
      `http://localhost:3000/demo-queue?jobId=${JOB_ID}`,
    );
    const result = await resp.json();
    console.log(`Job #${i}: ${JSON.stringify(result)}`);
    return result as { data: { id: number; data: object } };
  }),
);
const uniqueAddedJobs = new Set(repeatedJobs.map((j) => j.data.id));

const schedulersCount = await redisJobs.zCount(
  'queue:demo:repeat',
  '-inf',
  '+inf',
);
const scheduled = await redisJobs.hGet('queue:demo:repeat:heartbeat', 'ic');

console.log(
  `queue-noeviction=${config['maxmemory-policy'] === 'noeviction' ? 1 : 0}`,
);
console.log(`attempts=${attempts}`);
console.log(`added=${REPEATED_JOBS}`);
console.log(`queued=${uniqueAddedJobs.size}`);
console.log(`schedulers=${schedulersCount}`);
console.log(`scheduled-runs=${scheduled}`);

process.exit(0);
