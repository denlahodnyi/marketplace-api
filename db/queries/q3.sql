--  Search not cancelled orders by date range, price range

SELECT o.order_id, o.status, o.total, o.currency, o.created_at
FROM orders o
WHERE o.status != 'cancelled'
    AND o.total BETWEEN 2000 AND 3000
    AND o.created_at > date_trunc('day',now() - '7d'::INTERVAL)
