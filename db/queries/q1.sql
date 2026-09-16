-- Find 5 the most popular listings by number of cancelled orders

SELECT *, l.title FROM (
    SELECT ol.listing_id, count(ol.listing_id) orders_amount
    FROM order_lines ol
    JOIN orders o ON o.order_id = ol.order_id
    WHERE o.status = 'cancelled'
    GROUP BY ol.listing_id
    ORDER BY orders_amount DESC
    LIMIT 5
) sub
JOIN listings l ON sub.listing_id = l.listing_id
