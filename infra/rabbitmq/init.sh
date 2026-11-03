#!/bin/bash

MAX_RETRIES=10
RETRY_INTERVAL=2
attempt=0

until rabbitmq-diagnostics -q status >/dev/null 2>&1; do
  ((attempt++))
  if ((attempt >= MAX_RETRIES)); then
    echo "RabbitMQ is not ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "RabbitMQ is not ready. Attempt $attempt/$MAX_RETRIES. Retrying in ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo "RabbitMQ is ready!"

# Set DLX
rabbitmqctl set_policy DLX ".*" '{"dead-letter-exchange":"marketplace.dlx"}' --apply-to queues --priority 5
# Set Alternate exchange
rabbitmqctl set_policy AE ".*" '{"alternate-exchange":"marketplace.ae"}' --apply-to exchanges --priority 5
