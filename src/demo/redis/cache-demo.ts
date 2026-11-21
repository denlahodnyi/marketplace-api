import { execSync } from 'node:child_process';
import { createClient } from 'redis';
import '@dotenvx/dotenvx/config';

import { dataSource } from '../../data-source.js';

const redis = await createClient({ url: process.env.REDIS_URL })
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();
await redis.flushDb();

const config = await redis.configGet(['maxmemory', 'maxmemory-policy']);

const db = await dataSource.initialize();
console.log('Seeding...');
const output = execSync('pnpm seed --listings=50 --orders=0 --progress=false');
console.log(output.toString('utf8'));

const listings = await db
  .getRepository('Listing')
  .find({ take: 50, select: { listingId: true } });
const listingIds = listings.map((l) => l.listingId);

const distinctTTLs = new Set<number>();

console.log('Warm up...');
for (const listingId of listingIds) {
  await fetch(`http://localhost:3000/listings/${listingId}`);
  distinctTTLs.add(await redis.pTTL(`listing:${listingId}`));
}

let warmedCount = 0;

for await (const keys of redis.scanIterator({
  MATCH: 'listing:*',
  COUNT: 100,
})) {
  keys.forEach((k) => {
    if (/^listing:[0-9a-f-]{36}$/i.test(k)) {
      warmedCount++;
    }
  });
}

console.log(`Killing key listing:${listingIds[0]}`);
await redis.del(`listing:${listingIds[0]}`);
await redis.del(`listing:${listingIds[0]}:reqCount`);
await redis.del(`listing:${listingIds[0]}:dbHits`);

await Promise.all(
  Array.from({ length: 20 }, () =>
    fetch(`http://localhost:3000/listings/${listingIds[0]}`),
  ),
);

const reqs = await redis.get(`listing:${listingIds[0]}:reqCount`);
const dbHits = await redis.get(`listing:${listingIds[0]}:dbHits`);

await redis.set(`listing:${listingIds[0]}:reqCount`, 0);
await redis.set(`listing:${listingIds[0]}:dbHits`, 0);

await Promise.all(
  Array.from({ length: 100 }, () =>
    fetch(`http://localhost:3000/listings/${listingIds[0]}`),
  ),
);

const dbWarmHits = await redis.get(`listing:${listingIds[0]}:dbHits`);

console.log(`cache-maxmemory=${config.maxmemory !== '0' ? 1 : 0}`);
console.log(`cache-lru=${config['maxmemory-policy'] !== 'noeviction' ? 1 : 0}`);
console.log(`warmed=${warmedCount}`);
console.log(`ttl-distinct=${distinctTTLs.size}`);
console.log(`concurrent=${reqs}`);
console.log(`db-calls=${dbHits}`);
console.log(`db-calls-warm=${dbWarmHits}`);

process.exit(0);
