# orm

## N+1

Naive: ≥ 5 (1 query for customers (5 items) + 1 query per each customer in a loop)

Fixed: 1 (single query for customers and listings using QueryBuilder)

```sh
pnpm demo:nplus1
```

## Report using QueryBuilder

Repository vs QueryBuilder: use QueryBuilder when simple queries are not enough
(CTE, subqueries, aggregations)

```sh
pnpm demo:report
```
