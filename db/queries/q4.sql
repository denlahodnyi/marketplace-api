SELECT listing_id, title, ts_rank(search_vector, plainto_tsquery('simple', 'Велосипед')) AS rank
FROM listings
WHERE search_vector @@ plainto_tsquery('simple', 'Велосипед')
ORDER BY rank DESC
LIMIT 20
