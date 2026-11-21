#!/usr/bin/env bash

is_local=$1 # 1 = run without using Docker

echo "$is_local"

if [[ $is_local -ne 1 ]]; then
  docker compose up -d backend --wait
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

# Place order (retry)
curl localhost:3000/checkout -s \
  --json '{}' \
  -H "X-User-Id: 01a191ce-5236-72b5-bc74-1c94df1e59ac" \
  -H "Idempotency-Key: 7a9c83c2-f78f-4205-ac36-d8caad3eb97f" \
  -o /dev/null \
  -w "Submit checkout status: %{http_code}\n"

# Give queue some time to finish
wait_deliveries() {
  local max_attempts=10
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

if ! wait_deliveries; then
  docker compose down -v &>/dev/null
  exit 1
fi

broker_stats=$(curl -s -u app:app 'http://localhost:20301/api/queues/%2F/marketplace.orders.notifications?columns=name,delivery_limit,messages,messages_dlx,message_stats.publish,message_stats.deliver,message_stats.ack')

published=$(echo "$broker_stats" | jq -e '.message_stats.publish // 0')
deliveries=$(echo "$broker_stats" | jq -e '.message_stats.deliver // 0')

if [[ $is_local -ne 1 ]]; then
  orders=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM orders;")
  effect=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM notifications;")
  outbox=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM outbox;")
  processed=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM processed_messages;")
else
  orders=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM orders;")
  effect=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM notifications;")
  outbox=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM outbox;")
  processed=$(psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM processed_messages;")
fi

total_req=2
echo "requests=$total_req"
echo "orders=$orders"
echo "outbox=$outbox"
echo "published=$published"
echo "deliveries=$deliveries"
echo "effect=$effect"
echo "processed=$processed"

if [[ $is_local -ne 1 ]]; then
  docker compose down -v &>/dev/null
fi

if (( total_req != 2 || orders != 1 || outbox != 1 || published != 1 || effect != 1 || processed != 1 )); then
  echo "Failed demo"
  exit 1
fi
