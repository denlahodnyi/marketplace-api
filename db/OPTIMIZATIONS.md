# Query plans results

## Query #1

### Before:

```txt
|QUERY PLAN                                                                                                                                            |
|------------------------------------------------------------------------------------------------------------------------------------------------------|
|Nested Loop  (cost=6015.50..6057.27 rows=5 width=688) (actual time=50.089..50.131 rows=5.00 loops=1)                                                  |
|  Buffers: shared hit=3264                                                                                                                            |
|  ->  Limit  (cost=6015.08..6015.09 rows=5 width=24) (actual time=50.047..50.048 rows=5.00 loops=1)                                                   |
|        Buffers: shared hit=3244                                                                                                                      |
|        ->  Sort  (cost=6015.08..6029.91 rows=5930 width=24) (actual time=50.045..50.046 rows=5.00 loops=1)                                           |
|              Sort Key: (count(ol.listing_id)) DESC                                                                                                   |
|              Sort Method: top-N heapsort  Memory: 25kB                                                                                               |
|              Buffers: shared hit=3244                                                                                                                |
|              ->  HashAggregate  (cost=5857.29..5916.59 rows=5930 width=24) (actual time=49.120..49.573 rows=5534.00 loops=1)                         |
|                    Group Key: ol.listing_id                                                                                                          |
|                    Batches: 1  Memory Usage: 665kB                                                                                                   |
|                    Buffers: shared hit=3241                                                                                                          |
|                    ->  Hash Join  (cost=2860.12..5827.64 rows=5930 width=16) (actual time=22.755..47.818 rows=5909.00 loops=1)                       |
|                          Hash Cond: (ol.order_id = o.order_id)                                                                                       |
|                          Buffers: shared hit=3241                                                                                                    |
|                          ->  Seq Scan on order_lines ol  (cost=0.00..2705.00 rows=100000 width=32) (actual time=0.015..13.747 rows=100000.00 loops=1)|
|                                Buffers: shared hit=1705                                                                                              |
|                          ->  Hash  (cost=2786.00..2786.00 rows=5930 width=16) (actual time=22.702..22.703 rows=5909.00 loops=1)                      |
|                                Buckets: 8192  Batches: 1  Memory Usage: 341kB                                                                        |
|                                Buffers: shared hit=1536                                                                                              |
|                                ->  Seq Scan on orders o  (cost=0.00..2786.00 rows=5930 width=16) (actual time=0.022..21.188 rows=5909.00 loops=1)    |
|                                      Filter: (status = 'cancelled'::text)                                                                            |
|                                      Rows Removed by Filter: 94091                                                                                   |
|                                      Buffers: shared hit=1536                                                                                        |
|  ->  Index Scan using listings_pkey on listings l  (cost=0.42..8.44 rows=1 width=615) (actual time=0.015..0.015 rows=1.00 loops=5)                   |
|        Index Cond: (listing_id = ol.listing_id)                                                                                                      |
|        Index Searches: 5                                                                                                                             |
|        Buffers: shared hit=20                                                                                                                        |
|Planning:                                                                                                                                             |
|  Buffers: shared hit=249                                                                                                                             |
|Planning Time: 3.172 ms                                                                                                                               |
|Execution Time: 50.346 ms                                                                                                                             |

```

### After

```txt
|QUERY PLAN                                                                                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Nested Loop  (cost=4898.93..4940.70 rows=5 width=688) (actual time=41.759..41.798 rows=5.00 loops=1)                                                                            |
|  Buffers: shared hit=3233 read=6                                                                                                                                               |
|  ->  Limit  (cost=4898.52..4898.53 rows=5 width=24) (actual time=41.728..41.730 rows=5.00 loops=1)                                                                             |
|        Buffers: shared hit=3213 read=6                                                                                                                                         |
|        ->  Sort  (cost=4898.52..4913.34 rows=5930 width=24) (actual time=41.726..41.728 rows=5.00 loops=1)                                                                     |
|              Sort Key: (count(ol.listing_id)) DESC                                                                                                                             |
|              Sort Method: top-N heapsort  Memory: 25kB                                                                                                                         |
|              Buffers: shared hit=3213 read=6                                                                                                                                   |
|              ->  HashAggregate  (cost=4740.72..4800.02 rows=5930 width=24) (actual time=40.816..41.267 rows=5534.00 loops=1)                                                   |
|                    Group Key: ol.listing_id                                                                                                                                    |
|                    Batches: 1  Memory Usage: 665kB                                                                                                                             |
|                    Buffers: shared hit=3213 read=6                                                                                                                             |
|                    ->  Hash Join  (cost=1743.56..4711.07 rows=5930 width=16) (actual time=12.212..38.926 rows=5909.00 loops=1)                                                 |
|                          Hash Cond: (ol.order_id = o.order_id)                                                                                                                 |
|                          Buffers: shared hit=3213 read=6                                                                                                                       |
|                          ->  Seq Scan on order_lines ol  (cost=0.00..2705.00 rows=100000 width=32) (actual time=0.024..12.882 rows=100000.00 loops=1)                          |
|                                Buffers: shared hit=1705                                                                                                                        |
|                          ->  Hash  (cost=1669.43..1669.43 rows=5930 width=16) (actual time=12.131..12.131 rows=5909.00 loops=1)                                                |
|                                Buckets: 8192  Batches: 1  Memory Usage: 341kB                                                                                                  |
|                                Buffers: shared hit=1508 read=6                                                                                                                 |
|                                ->  Bitmap Heap Scan on orders o  (cost=59.31..1669.43 rows=5930 width=16) (actual time=1.395..10.225 rows=5909.00 loops=1)                     |
|                                      Recheck Cond: (status = 'cancelled'::text)                                                                                                |
|                                      Heap Blocks: exact=1508                                                                                                                   |
|                                      Buffers: shared hit=1508 read=6                                                                                                           |
|                                      ->  Bitmap Index Scan on orders_cancelled_status_idx  (cost=0.00..57.83 rows=5930 width=0) (actual time=1.184..1.184 rows=5909.00 loops=1)|
|                                            Index Searches: 1                                                                                                                   |
|                                            Buffers: shared read=6                                                                                                              |
|  ->  Index Scan using listings_pkey on listings l  (cost=0.42..8.44 rows=1 width=615) (actual time=0.012..0.012 rows=1.00 loops=5)                                             |
|        Index Cond: (listing_id = ol.listing_id)                                                                                                                                |
|        Index Searches: 5                                                                                                                                                       |
|        Buffers: shared hit=20                                                                                                                                                  |
|Planning:                                                                                                                                                                       |
|  Buffers: shared hit=50 read=1                                                                                                                                                 |
|Planning Time: 4.747 ms                                                                                                                                                         |
|Execution Time: 42.013 ms                                                                                                                                                       |

```

What changed:

- "Seq Scan on orders o" changed to "Bitmap Index Scan on
  orders_cancelled_status_idx"
- Buffers: shared read=6 at Bitmap Index Scan on orders_cancelled_status_idx vs
  Buffers: shared hit=1536 at Seq Scan on orders o
- Decreased execution time

## Query #2

### Before

```txt
|QUERY PLAN                                                                                                             |
|-----------------------------------------------------------------------------------------------------------------------|
|Nested Loop  (cost=0.00..10101.45 rows=65 width=88) (actual time=1.596..81.488 rows=54.00 loops=1)                     |
|  Join Filter: (cat.category_id = l.category_id)                                                                       |
|  Rows Removed by Join Filter: 1220                                                                                    |
|  Buffers: shared hit=8335                                                                                             |
|  ->  Seq Scan on categories cat  (cost=0.00..1.25 rows=1 width=47) (actual time=0.174..0.190 rows=1.00 loops=1)       |
|        Filter: (name ~~* '%іграшки%'::text COLLATE "uk_UA")                                                           |
|        Rows Removed by Filter: 19                                                                                     |
|        Buffers: shared hit=1                                                                                          |
|  ->  Seq Scan on listings l  (cost=0.00..10084.00 rows=1296 width=73) (actual time=0.428..81.169 rows=1274.00 loops=1)|
|        Filter: ((price < '1000'::numeric) AND (status = 'active'::text) AND (item_condition = 'new'::text))           |
|        Rows Removed by Filter: 98726                                                                                  |
|        Buffers: shared hit=8334                                                                                       |
|Planning:                                                                                                              |
|  Buffers: shared hit=4                                                                                                |
|Planning Time: 1.413 ms                                                                                                |
|Execution Time: 81.942 ms                                                                                              |

```

### After

```txt
|QUERY PLAN                                                                                                                                                |
|----------------------------------------------------------------------------------------------------------------------------------------------------------|
|Nested Loop  (cost=62.95..3543.91 rows=65 width=88) (actual time=1.711..7.528 rows=54.00 loops=1)                                                         |
|  Join Filter: (cat.category_id = l.category_id)                                                                                                          |
|  Rows Removed by Join Filter: 1220                                                                                                                       |
|  Buffers: shared hit=1201 read=16                                                                                                                        |
|  ->  Seq Scan on categories cat  (cost=0.00..1.25 rows=1 width=47) (actual time=0.124..0.157 rows=1.00 loops=1)                                          |
|        Filter: (name ~~* '%іграшки%'::text COLLATE "uk_UA")                                                                                              |
|        Rows Removed by Filter: 19                                                                                                                        |
|        Buffers: shared hit=1                                                                                                                             |
|  ->  Bitmap Heap Scan on listings l  (cost=62.95..3526.46 rows=1296 width=73) (actual time=1.420..7.013 rows=1274.00 loops=1)                            |
|        Recheck Cond: ((item_condition = 'new'::text) AND (price < '1000'::numeric) AND (status = 'active'::text))                                        |
|        Heap Blocks: exact=1195                                                                                                                           |
|        Buffers: shared hit=1200 read=16                                                                                                                  |
|        ->  Bitmap Index Scan on listings_active_cond_price_date_idx  (cost=0.00..62.63 rows=1296 width=0) (actual time=1.052..1.052 rows=1274.00 loops=1)|
|              Index Cond: ((item_condition = 'new'::text) AND (price < '1000'::numeric))                                                                  |
|              Index Searches: 4                                                                                                                           |
|              Buffers: shared hit=5 read=16                                                                                                               |
|Planning:                                                                                                                                                 |
|  Buffers: shared hit=40 read=1                                                                                                                           |
|Planning Time: 1.606 ms                                                                                                                                   |
|Execution Time: 7.611 ms                                                                                                                                  |


```

What changed:

- "Seq Scan on listings l" changed to "Bitmap Index Scan on
  listings_active_cond_price_date_idx" + new "Bitmap Heap Scan on listings l"
- Decreased total buffers shared hit: hit=8335 –> hit=1201
- Decreased execution time

## Query #3

### Before

```txt
|QUERY PLAN                                                                                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Seq Scan on orders o  (cost=0.00..4286.00 rows=10294 width=43) (actual time=0.119..64.886 rows=10441.00 loops=1)                                                                |
|  Filter: ((status <> 'cancelled'::text) AND (total >= '2000'::numeric) AND (total <= '3000'::numeric) AND (created_at > date_trunc('day'::text, (now() - '7 days'::interval))))|
|  Rows Removed by Filter: 89559                                                                                                                                                 |
|  Buffers: shared hit=1536                                                                                                                                                     |
|Planning Time: 0.342 ms                                                                                                                                                         |
|Execution Time: 65.900 ms                                                                                                                                                       |
```

### After

```txt
|QUERY PLAN                                                                                                                                              |
|--------------------------------------------------------------------------------------------------------------------------------------------------------|
|Bitmap Heap Scan on orders o  (cost=311.79..2148.72 rows=10294 width=43) (actual time=2.097..17.617 rows=10441.00 loops=1)                              |
|  Recheck Cond: ((total >= '2000'::numeric) AND (total <= '3000'::numeric) AND (created_at > date_trunc('day'::text, (now() - '7 days'::interval))))    |
|  Filter: (status <> 'cancelled'::text)                                                                                                                 |
|  Rows Removed by Filter: 603                                                                                                                           |
|  Heap Blocks: exact=1536                                                                                                                               |
|  Buffers: shared hit=1582                                                                                                                              |
|  ->  Bitmap Index Scan on orders_by_total_and_date_idx  (cost=0.00..309.21 rows=10943 width=0) (actual time=1.859..1.859 rows=11044.00 loops=1)        |
|        Index Cond: ((total >= '2000'::numeric) AND (total <= '3000'::numeric) AND (created_at > date_trunc('day'::text, (now() - '7 days'::interval))))|
|        Index Searches: 1                                                                                                                               |
|        Buffers: shared hit=46                                                                                                                          |
|Planning Time: 0.346 ms                                                                                                                                 |
|Execution Time: 18.292 ms                                                                                                                               |

```

What changed:

- "Seq Scan on orders o" changed to "Bitmap Index Scan on
  orders_by_total_and_date_idx" + "Bitmap Heap Scan on orders o"
- Decreased removed rows: 89559 –> 603
- Decreased execution time

## Query #4

### Before

```txt
|QUERY PLAN                                                                                                                |
|--------------------------------------------------------------------------------------------------------------------------|
|Limit  (cost=9615.55..9615.60 rows=20 width=69) (actual time=44.334..44.337 rows=20.00 loops=1)                           |
|  Buffers: shared hit=8351                                                                                                |
|  ->  Sort  (cost=9615.55..9616.80 rows=500 width=69) (actual time=44.332..44.334 rows=20.00 loops=1)                     |
|        Sort Key: (ts_rank(search_vector, '''Велосипед'''::tsquery)) DESC                                                 |
|        Sort Method: top-N heapsort  Memory: 27kB                                                                         |
|        Buffers: shared hit=8351                                                                                          |
|        ->  Seq Scan on listings  (cost=0.00..9602.25 rows=500 width=69) (actual time=0.038..42.520 rows=10000.00 loops=1)|
|              Filter: (search_vector @@ '''Велосипед'''::tsquery)                                                         |
|              Rows Removed by Filter: 90000                                                                               |
|              Buffers: shared hit=8351                                                                                    |
|Planning Time: 0.157 ms                                                                                                   |
|Execution Time: 44.420 ms                                                                                                 |

```

### After

```txt
|QUERY PLAN                                                                                                                                             |
|-------------------------------------------------------------------------------------------------------------------------------------------------------|
|Limit  (cost=1632.79..1632.84 rows=20 width=69) (actual time=26.443..26.446 rows=20.00 loops=1)                                                        |
|  Buffers: shared hit=8341                                                                                                                             |
|  ->  Sort  (cost=1632.79..1634.04 rows=500 width=69) (actual time=26.441..26.443 rows=20.00 loops=1)                                                  |
|        Sort Key: (ts_rank(search_vector, '''Велосипед'''::tsquery)) DESC                                                                              |
|        Sort Method: top-N heapsort  Memory: 27kB                                                                                                      |
|        Buffers: shared hit=8341                                                                                                                       |
|        ->  Bitmap Heap Scan on listings  (cost=19.71..1619.48 rows=500 width=69) (actual time=3.183..23.650 rows=10000.00 loops=1)                    |
|              Recheck Cond: (search_vector @@ '''Велосипед'''::tsquery)                                                                                |
|              Heap Blocks: exact=8333                                                                                                                  |
|              Buffers: shared hit=8341                                                                                                                 |
|              ->  Bitmap Index Scan on listings_search_vector_idx  (cost=0.00..19.59 rows=500 width=0) (actual time=1.770..1.770 rows=10000.00 loops=1)|
|                    Index Cond: (search_vector @@ '''Велосипед'''::tsquery)                                                                            |
|                    Index Searches: 1                                                                                                                  |
|                    Buffers: shared hit=8                                                                                                              |
|Planning:                                                                                                                                              |
|  Buffers: shared hit=1                                                                                                                                |
|Planning Time: 0.288 ms                                                                                                                                |
|Execution Time: 26.479 ms                                                                                                                              |
```

What changed:

- Decreased execution time

### Морфологія

1.`SELECT count(*) FROM listings WHERE search_vector @@
plainto_tsquery('simple', 'Велосипед');` –> result: 10000

2.`SELECT count(*) FROM listings WHERE search_vector @@
plainto_tsquery('simple', 'Велосипеди');` –> result: 0

3.`SELECT count(*) FROM listings WHERE search_vector @@
plainto_tsquery('simple', 'Велосипедів');` –> result: 0

Reason: no Ukrainian text search parser (checked in `SELECT * FROM pg_ts_config`)
