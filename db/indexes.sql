-- For Q#1
CREATE INDEX IF NOT EXISTS orders_cancelled_status_idx ON orders (status) WHERE status = 'cancelled';
-- For Q#2
CREATE INDEX IF NOT EXISTS listings_active_cond_price_date_idx ON listings (item_condition, selling_method, price, created_at DESC) WHERE status = 'active';
-- For Q#3
CREATE INDEX IF NOT EXISTS orders_by_total_and_date_idx ON orders (total, created_at);
-- For Q#4
CREATE INDEX IF NOT EXISTS listings_search_vector_idx ON listings USING GIN (search_vector);
