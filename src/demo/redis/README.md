# Redis: кеш, сесії, ліміти, черга

## Demo #1 (cache)

What happens if stampede lock breaks? Several requests will be sent to the
database. Lock here is an optimization, not correctness.

How to start:

Variant #1 (docker only):

```sh
ENABLE_CACHE_DEMO_STATS=true docker compose up -d --wait
docker compose exec -T backend pnpm demo:cache
docker compose down -v
```

Variant #2:

```sh
ENABLE_CACHE_DEMO_STATS=true docker compose up -d --wait
REDIS_URL=redis://localhost:20120 DB_URL=postgresql://admin:some_strong_password@localhost:20101/market pnpm demo:cache
docker compose down -v
```

Expected output:

```sh
cache-maxmemory=1
maxmemory-policy=1
warmed=50
ttl-distinct=50
concurrent=20
db-calls=2   # 1-2
db-calls-warm=0
```

## Demo #2 (session)

For the sessions I've decided to use a second Redis instance, dedicated for the
BullMQ. This will allow me to limit the number of instances used.

How to start:

```sh
docker compose up -d --wait
docker compose exec -T backend pnpm demo:session
docker compose down -v
```

Expected output:

```sh
requests=6
sessions=1
in-redis=1
ttl-renewed=1
```

## Demo #3 (rate limit)

Selected strategy – sliding window. I think it's nice general-purpose algorithm.

How to start:

```sh
docker compose up -d --wait
docker compose exec -T backend pnpm demo:ratelimit
docker compose down -v
```

Expected output:

```sh
instances=2
allowed=3
blocked=2
status=429
retry-after=1
```

## Demo #4 (BullMQ)

Why two Redis instances? Because cache storage and queue have incompatible
`maxmemory-policy` requirements. BullMQ needs disabled cache eviction:
"cannot work properly if Redis evicts keys arbitrarily".

How to start:

```sh
docker compose up -d --wait
docker compose exec -T backend pnpm demo:queue
docker compose down -v
```

Expected output:

```sh
queue-noeviction=1
attempts=4
added=2
queued=1
schedulers=1
scheduled-runs=52
```
