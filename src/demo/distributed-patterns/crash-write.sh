#!/usr/bin/env bash

is_local=$1 # 1 = run without using Docker

echo "$is_local"

if [[ $is_local -ne 1 ]]; then
  ENABLE_CRASH_WRITE=true docker compose up -d backend --wait
  docker compose exec -T backend pnpm seed --listings=2 --orders=0 --progress=false >/dev/null
else
  pnpm seed --listings=2 --orders=0
fi

# Add listing to cart
curl localhost:3000/cart -s \
  --json '{"listingId": "01a19801-2d38-73b5-9312-0d738bd16be4", "quantity": 1}'\
  -H "X-User-Id: 01a191ce-5236-72b5-bc74-1c94df1e59ac" \
  -o /dev/null \
  -w "Add to cart status: %{http_code}\n"

# Place order
curl localhost:3000/checkout -s \
  --json '{}' \
  -H "X-User-Id: 01a191ce-5236-72b5-bc74-1c94df1e59ac" \
  -H "Idempotency-Key: 7a9c83c2-f78f-4205-ac36-d8caad3eb97f" \
  -o /dev/null \
  -w "Submit checkout status: %{http_code}\n"

# Give queue some time to finish
wait_deliveries() {
  local max_attempts=5
  local delay=0.5
  local attempt=1

  while (( attempt <= max_attempts )); do
    publish_in=$(curl -s -u app:app 'http://localhost:20301/api/exchanges/%2F/marketplace.events?columns=message_stats.publish_in' | jq '.message_stats?.publish_in // 0')

    if (( publish_in == 1 )); then
      echo "All messages are published"
      return 0
    fi

    echo "Waiting for all deliveries... ($attempt/$max_attempts)"
    sleep "$delay"s # in sec
    ((attempt++))
  done

  echo "ERROR: exchange received less messages after $max_attempts attempts." >&2
  return 1
}

broker_stats=$(curl -s -u app:app 'http://localhost:20301/api/queues/%2F/marketplace.orders.notifications?columns=name,delivery_limit,messages,messages_dlx,message_stats.publish,message_stats.deliver,message_stats.ack')

published=$(echo "$broker_stats" | jq -e '.message_stats.publish // 0')
deliveries=$(echo "$broker_stats" | jq -e '.message_stats.deliver // 0')

if [[ $is_local -ne 1 ]]; then
  orders=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM orders;")
  effect=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM notifications;")
  outbox=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM outbox;")
  processed=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM processed_messages;")
  crash_error=$(
    docker compose logs backend 2>&1 | grep -oE 'Simulated failed business operation'
  )
else
  orders=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM orders;")
  effect=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM notifications;")
  outbox=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM outbox;")
  processed=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM processed_messages;")
  crash_error="test"
fi

write_failed=0

if [[ -n $crash_error ]]; then
  echo "Source error: \"$crash_error\""
  write_failed=1
fi

echo "write-failed=$write_failed"
echo "orders=$orders"
echo "outbox=$outbox"
echo "published=$published"
echo "deliveries=$deliveries"
echo "effect=$effect"

if [[ $is_local -ne 1 ]]; then
  docker compose down -v &>/dev/null
fi

if (( write_failed != 1 || orders != 0 || outbox != 0 || published != 0 || deliveries != 0 || effect != 0 )); then
  echo "Failed demo"
  exit 1
fi
