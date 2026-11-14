# Outbox та ідемпотентність

## Demo #1 (outbox)

In the future outbox table size may be decreased by deleting published records in the background.

```sh
pnpm demo:outbox
```

Expected output:

```sh
requests=2
orders=1
outbox=1
published=1
deliveries=1
effect=1
processed=1
```

## Demo #2 (crash write)

```sh
pnpm demo:crash-write
```

Expected output:

```sh
write-failed=1
orders=0
outbox=0
published=0
deliveries=0
effect=0
```

## Demo #3 (crash relay)

Relay is crashed using artificial exception after publish and before outbox update.

```sh
pnpm demo:crash-relay
```

Expected output:

```sh
published=2
deliveries=2
effect=1
processed=1
applied=1
```
