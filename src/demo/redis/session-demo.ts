import { execSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import '@dotenvx/dotenvx/config';
import { createClient } from 'redis';

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
const res = await fetch(`http://localhost:3000/listings/${LISTING_ID}`);
const cookie = res.headers.get('set-cookie');

if (!cookie) throw new Error('Session cookie was not found');

const sessionKeys = await redisJobs.keys('sess:*');

if (sessionKeys.length > 1)
  throw new Error('Too many session keys, must be one');

const ttl = await redisJobs.ttl(sessionKeys[0]);

for (let i = 0; i < 5; i++) {
  await fetch(`http://localhost:3000/listings/${LISTING_ID}`, {
    headers: {
      cookie,
    },
  });
  await setTimeout(1000);
}

const ttl2 = await redisJobs.ttl(sessionKeys[0]);
const sessionKeysAfter = await redisJobs.keys('sess:*');

console.log(`requests=6`);
console.log(`sessions=${sessionKeysAfter.length}`);
console.log(`in-redis=${sessionKeysAfter.length === 1 ? 1 : 0}`);
console.log(`ttl-renewed=${ttl - ttl2 >= 0 && ttl - ttl2 < 5 ? 1 : 0}`); // renewed ttl must be less then 5 seconds spent on requests

process.exit(0);
