# Async-події через RabbitMQ

Selected prefetch: 100. Not 0 (default) to prevent uneven messages distribution. Not 1
to improve throughput. It also won't exceed consumer timeout, which causes closed
connection and requeued messages (prefetch x message handling time < consumer_timeout).

---

All demos require only .env (see .env.example for the reference).

## Demo #1 (publish)

```sh
pnpm demo:publish
```

Expected output:

```sh
published=5
delivered=5
effects=5
acked=5
dlq=0
prefetch=100
```

## Demo #2 (dlq)

DLX is triggered via queue limit (`max-length-bytes`).

```sh
pnpm demo:dlq
```

Expected output:

```sh
prefetch=1
work=1
dlq=1
effects=1
dlq-reason=maxlen
```

## Demo #3 (duplicate)

RabbitMQ has no exactly-once delivery, only effect, which is accomplished using at-least-once
delivery + idempotent effect. At-least-once delivery can be accomplished using
manual acknowledge (while auto ack = at-most-once). In this demo repeated effect is
prevented by checking `message_id` which is persisted in DB. Duplicate record is
disallowed using `ON CONFLICT DO NOTHING` constraint.

```sh
pnpm demo:duplicate
```

Expected output:

```sh
deliveries=2
skipped=1
effect=1
```
