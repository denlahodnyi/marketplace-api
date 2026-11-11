#!/usr/bin/env bash

docker compose up -d backend --wait
docker compose exec -T backend pnpm seed --listings=2 --orders=0 --progress=false >/dev/null

for i in {1..5}; do
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
    -o /dev/null \
    -w "Submit checkout status: %{http_code}\n"
done

# Give queue some time to finish
wait_deliveries() {
  local max_attempts=10
  local delay=0.5
  local attempt=1

  while (( attempt <= max_attempts )); do
    publish_in=$(curl -s -u app:app 'http://localhost:20301/api/exchanges/%2F/marketplace.events?columns=message_stats.publish_in' | jq '.message_stats?.publish_in // 0')

    if (( publish_in == 5 )); then
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

prefetch=$(curl -s -u app:app 'http://localhost:20301/api/consumers/%2F?columns=prefetch_count,queue.name' | jq '.[] | select(.queue.name == "marketplace.orders.notifications") | .prefetch_count')
stats=$(curl -s -u app:app 'http://localhost:20301/api/queues/%2F/marketplace.orders.notifications?columns=name,delivery_limit,messages,messages_dlx,message_stats.publish,message_stats.deliver,message_stats.ack')
stats_dlq=$(curl -s -u app:app 'http://localhost:20301/api/queues/%2F/marketplace.dlq?columns=name,delivery_limit,messages,messages_dlx,message_stats.publish,message_stats.deliver,message_stats.ack')

published=$(echo "$stats" | jq -e '.message_stats.publish // 0')
delivered=$(echo "$stats" | jq -e '.message_stats.deliver // 0')
effect=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM notifications;")
acked=$(echo "$stats" | jq -e '.message_stats.ack // 0')
dlq=$(echo "$stats_dlq" | jq -e '.message_stats.deliver // 0')

echo "published=$published"
echo "delivered=$delivered"
echo "effect=$effect"
echo "acked=$acked"
echo "dlq=$dlq"
echo "prefetch=$prefetch"

docker compose down -v &>/dev/null

if (( published != 5 || delivered != 5 || effect != 5 || acked != 5 || dlq != 0 )); then
  echo "Failed demo"
  exit 1
fi
