# Concurrency

## Race

Total tries: 50

Total successful tries: 10

Final quantity: 0

Rows with negative quantity: 0

Selected lock strategy – pessimistic lock, because I have additional logic
(order and order line creation) between reading selected listing and modifying it.

## Workers

Total time: 709 ms (50 ms per task)

Total workers: 4

Tasks per workers: [12,13,12,13]

Processed tasks: 50

Duplicates: 0

## Retry

Error 40001: could not serialize access due to concurrent update

Retry #: 1

Backoff: 69
