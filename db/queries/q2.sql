-- Find new toys under 1000 UAH

SELECT title, cat.name, l.price
FROM listings l
JOIN categories cat ON cat.category_id = l.category_id
WHERE l.status = 'active'
    AND l.item_condition = 'new'
    AND l.price < 1000
    AND cat.name ILIKE '%іграшки%' COLLATE "uk_UA"
