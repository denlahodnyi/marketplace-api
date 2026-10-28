# Real time demo

WebSockets demo:

```bash
# Start application
pnpm start

# Run demo
pnpm demo:realtime

# Example output:
# Is the same room false
# CLIENT_A connected (socket: bfTGXZJDSI6nl--BAAAA)
# CLIENT_B connected (socket: Z9p_D_b1Acuo1edmAAAB)
# CLIENT_A joined the room order:01a15f93-884a-72df-9a39-0d0d93df5203 (socket: bfTGXZJDSI6nl--BAAAA)
# CLIENT_B joined the room order:01a15f93-884a-72e0-9668-85c6ec525bb3 (socket: Z9p_D_b1Acuo1edmAAAB)
# CLIENT_A received changed status "confirmed" for order 01a15f93-884a-72df-9a39-0d0d93df5203 (socket: bfTGXZJDSI6nl--BAAAA | server socket: )
# CLIENT_A curl response: 200
# A_RECEIVED=1
# B_RECEIVED=0
# CLIENT_A disconnected
# CLIENT_B disconnected


# Same room clients
pnpm demo:realtime --same-room

# Example output:
# Is the same room true
# CLIENT_A connected (socket: loZuge-OqOImK0ysAAAC)
# CLIENT_B connected (socket: MRSRCn4PCUNzJ84wAAAD)
# CLIENT_A joined the room order:01a15f93-884a-72df-9a39-0d0d93df5203 (socket: loZuge-OqOImK0ysAAAC)
# CLIENT_B joined the room order:01a15f93-884a-72df-9a39-0d0d93df5203 (socket: MRSRCn4PCUNzJ84wAAAD)
# CLIENT_A received changed status "confirmed" for order 01a15f93-884a-72df-9a39-0d0d93df5203 (socket: loZuge-OqOImK0ysAAAC | server socket: )
# CLIENT_B received changed status "confirmed" for order 01a15f93-884a-72df-9a39-0d0d93df5203 (socket: MRSRCn4PCUNzJ84wAAAD | server socket: )
# CLIENT_A curl response: 200
# A_RECEIVED=1
# B_RECEIVED=1
# CLIENT_A disconnected
# CLIENT_B disconnected
```

SSE demo (uses order created on WS demo):

```sh
# Start application
pnpm start
# Change order status multiple times
curl -s localhost:3000/orders/01a15f93-884a-72e0-9668-85c6ec525bb3/actions/status-change \
      -X PATCH -d '{"status":"pending"}' \
      -H "X-User-Id: 01a15f93-884a-72d6-ab8e-e3b8da66e16c" \
      -H "Content-Type: application/json" \
      -w "%{http_code}" \
      -o /dev/null

curl -s localhost:3000/orders/01a15f93-884a-72e0-9668-85c6ec525bb3/actions/status-change \
      -X PATCH -d '{"status":"confirmed"}' \
      -H "X-User-Id: 01a15f93-884a-72d6-ab8e-e3b8da66e16c" \
      -H "Content-Type: application/json" \
      -w "%{http_code}" \
      -o /dev/null

curl -s localhost:3000/orders/01a15f93-884a-72e0-9668-85c6ec525bb3/actions/status-change \
      -X PATCH -d '{"status":"delivered"}' \
      -H "X-User-Id: 01a15f93-884a-72d6-ab8e-e3b8da66e16c" \
      -H "Content-Type: application/json" \
      -w "%{http_code}" \
      -o /dev/null

curl -s localhost:3000/orders/01a15f93-884a-72e0-9668-85c6ec525bb3/actions/status-change \
      -X PATCH -d '{"status":"completed"}' \
      -H "X-User-Id: 01a15f93-884a-72d6-ab8e-e3b8da66e16c" \
      -H "Content-Type: application/json" \
      -w "%{http_code}" \
      -o /dev/null

# View all events
curl -sN --max-time 2 http://localhost:3000/orders/01a15f93-884a-72e0-9668-85c6ec525bb3/events
# ...or from specific ID
curl -sN --max-time 2 http://localhost:3000/orders/01a15f93-884a-72e0-9668-85c6ec525bb3/events -H "Last-Event-ID: 3"

# Example output:
# event: status_change
# id: 3
# retry: 2000
# data: {"status":"confirmed","orderId":"01a15f93-884a-72e0-9668-85c6ec525bb3"}

# event: status_change
# id: 4
# retry: 2000
# data: {"status":"delivered","orderId":"01a15f93-884a-72e0-9668-85c6ec525bb3"}
```

## Trade-offs

WebSockets vs SSE

|                    | SSE                                                        | WS                                                                        |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Direction          | Unidirectional (Server-to-Client)                          | Bidirectional                                                             |
| Reconnect/Recovery | Has built-in reconnect and continuation with Last-Event-ID | Only with external lib (Socket.io)                                        |
| Infra              | Browser supports (same HTTP)                               | Separate protocol; browser supports but Socket.io requires its own client |
| Price per event    | ~0 latency                                                 | ~0 latency                                                                |

For notifications in prod I would choose SSE – cheap and simple, doesn't require
bidirectional communication.

WebSockets (Socket.io) issue with multiple instances: client that live on
separate instances won't see each other messages. Solution: use non-default
adapter. For example, Redis Pub/Sub adapter allows using Redis as a single
source of truth for subscribed instances.
