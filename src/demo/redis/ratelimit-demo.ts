import { execSync, spawn } from 'node:child_process';
import { createClient } from 'redis';
import '@dotenvx/dotenvx/config';

import { dataSource } from '../../data-source.js';

const redis = await createClient({ url: process.env.REDIS_URL })
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();
const redisJobs = await createClient({ url: process.env.REDIS_JOBS_URL })
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();
await redis.flushDb();
await redisJobs.flushDb();

const db = await dataSource.initialize();
console.log('Seeding...');
const output = execSync('pnpm seed --listings=50 --orders=0 --progress=false');
console.log(output.toString('utf8'));

const LISTING_ID = '01a19801-2d38-73b5-9312-0d738bd16be4';
const instances = ['api-1', 'api-2'];

const children = instances.map((instanceId, index) => {
  const child = spawn('pnpm', ['start:dev'], {
    env: {
      ...process.env,
      PORT: String(3001 + index),
      RATE_LIMIT_TTL: '60',
      RATE_LIMIT_LIMIT: '3',
    },
    stdio: 'ignore',
    shell: false,
  });

  child.on('exit', (code) => {
    console.log(`${instanceId} exited with code ${code}`);
  });

  return child;
});

console.log(
  'PID',
  children.map((c) => c.pid),
);

function shutdown() {
  for (const child of children) {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function waitForReady(port: string, timeout = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        console.log(`Instance at ${port} is ready`);
        return;
      }
    } catch {
      // Instance is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Instance on port ${port} failed to start`);
}

console.log('Waiting for the instances...');
await Promise.all(children.map((c, i) => waitForReady(String(3001 + i))));

let passed = 0;
let blocked = 0;
let errorStatus = null;
let retryAfterExists = false;

await Promise.all(
  Array.from({ length: 5 }, async (_, i) => {
    const port = i % 2 !== 0 ? 3001 : 3002;
    const resp = await fetch(`http://localhost:${port}/listings/${LISTING_ID}`);
    const status = resp.status;
    console.log(`${status} at ${port}`);
    if (status === 200) {
      passed += 1;
    } else {
      blocked += 1;
      errorStatus = status;
      retryAfterExists = resp.headers.has('retry-after');
    }
  }),
);

console.log(`instances=${instances.length}`);
console.log(`allowed=${passed}`);
console.log(`blocked=${blocked}`);
console.log(`status=${errorStatus}`);
console.log(`retry-after=${Number(retryAfterExists)}`);

shutdown();
process.exit(0);
