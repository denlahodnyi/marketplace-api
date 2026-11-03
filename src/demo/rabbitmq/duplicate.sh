# Bootstrap app and broker
docker compose up -d backend --wait
docker compose exec -T backend pnpm seed --listings=2 --orders=0 --progress=false >/dev/null

# Place order #1
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

wait_deliveries() {
  local max_attempts=10
  local delay=0.5
  local attempt=1

  while (( attempt <= max_attempts )); do
    publish_in=$(curl -s -u app:app 'http://localhost:20301/api/exchanges/%2F/marketplace.events?columns=message_stats.publish_in' | jq '.message_stats?.publish_in // 0')

    if (( publish_in == $1 )); then
      echo "All messages are published"
      return 0
    fi

    echo "Waiting for all deliveries... publish_in=$publish_in ($attempt/$max_attempts)"
    sleep "$delay"s # in sec
    ((attempt++))
  done

  echo "ERROR: exchange received less messages after $max_attempts attempts." >&2
  return 1
}

if ! wait_deliveries 1; then
  docker compose down -v &>/dev/null
  exit 1
fi

# Take event_id from the created notification and use it for the message with
# the duplicated message_id
event_id=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT event_id FROM notifications LIMIT 1;")
order_id=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT data ->> 'orderId' FROM notifications LIMIT 1;")

echo "event_id $event_id"
echo "order_id $order_id"

payload="{\"data\":{\"orderId\":\"$order_id\"},\"pattern\":\"order.created\"}"

body=$(jq -n \
  --arg event_id "$event_id" \
  --arg payload "$payload" \
  '{
    properties: {
      message_id: $event_id
    },
    routing_key: "order.created",
    payload: $payload,
    payload_encoding: "string"
  }')

# Publish message with the duplicate message_id directly to the broker
routed=$(curl -s -u app:app \
  'http://localhost:20301/api/exchanges/%2F/marketplace.events/publish' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "$body" | jq -r '.routed')

echo "routed $routed"

if [[ ! routed ]]; then
  docker compose down -v &>/dev/null
  echo "Cannot publish message"
  exit 1;
fi

if ! wait_deliveries 2; then
  docker compose down -v &>/dev/null
  exit 1
fi

stats=$(curl -s -u app:app 'http://localhost:20301/api/queues/%2F/marketplace.orders.notifications?columns=name,delivery_limit,messages,messages_dlx,message_stats.publish,message_stats.deliver,message_stats.ack')
deliveries=$(echo "$stats" | jq -e '.message_stats.deliver // 0')
effect=$(docker compose exec -T db psql -p 5432 -U admin -h 127.0.0.1 -d market -q -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM notifications;")
skipped=$((deliveries - effect))

echo "deliveries=$deliveries"
echo "skipped=$skipped"
echo "effect=$effect"

docker compose down -v &>/dev/null

if (( deliveries != 2 || effect != 1 || skipped != 1 )); then
  echo "Failed demo"
  exit 1
fi
