-- PostgreSQL test seed for the marketplace schema.
-- Run after the DDL has been successfully created.
--
-- Main tuning knobs:
--   v_listing_count        Number of listings to generate.
--   v_order_count          Number of orders to generate.
--   v_low_price_percent   Percentage of listings deliberately given a very
--                          small price. Useful for testing selective predicates
--                          such as: WHERE price < 20.
--   v_normal_price_min/max Normal listing price range.
--   v_low_price_min/max   Small-price listing range.
--   v_order_amount_min/max Base order amount range.
--
-- The seed is intentionally UAH-only.

-- SET search_path TO develop;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- =========================
    -- Configuration
    -- =========================
    v_listing_count       integer := 100000;
    v_order_count         integer := 100000;

    -- Price mode controls how all *_price_* configuration values are entered.
    -- 'major': 100 = 100 UAH; 'minor': 10000 = 100 UAH (kopecks).
    v_price_mode          text := 'major';
    v_minor_units_per_major numeric := 100;     -- UAH has 100 kopecks per hryvnia.

    v_low_price_percent   numeric := 1.0;       -- 1% of listings
    v_low_price_min       numeric := 1.00;
    v_low_price_max       numeric := 20.00;
    v_normal_price_min    numeric := 100.00;
    v_normal_price_max    numeric := 50000.00;

    v_order_amount_min    numeric := 100.00;
    v_order_amount_max    numeric := 10000.00;

    -- Controls how unevenly orders are distributed across listings.
    -- 1.0 = approximately uniform; values > 1.0 concentrate more orders
    -- on listings near the beginning of v_listing_ids.
    v_order_listing_skew  numeric := 2.0;

    v_now                 timestamptz := now();

    -- User generation
    v_names text[] := ARRAY[
        'Олександр', 'Андрій', 'Максим', 'Дмитро', 'Іван',
        'Микола', 'Богдан', 'Тарас', 'Артем', 'Роман'
    ];
    v_surnames text[] := ARRAY[
        'Шевченко', 'Коваленко', 'Бондаренко', 'Мельник', 'Ткаченко',
        'Кравченко', 'Олійник', 'Поліщук', 'Лисенко', 'Савченко'
    ];

    v_user_id            uuid;
    v_buyer_id           uuid;
    v_seller_id          uuid;
    v_listing_id         uuid;
    v_category_id        uuid;
    v_order_id           uuid;
    v_auc_id             uuid;
    v_bid_id             uuid;
    v_offer_id           uuid;
    v_chat_id             uuid;
    v_message_id         uuid;
    v_listing_title      text;
    v_price              numeric;
    v_order_amount       numeric;
    v_quantity            integer;
    v_i                  integer;
    v_j                  integer;
    v_delimiter          text;
    v_email              text;
    v_first_name         text;
    v_last_name          text;

    v_customer_ids       uuid[];
    v_admin_ids          uuid[];
    v_listing_ids        uuid[];
    v_auction_ids        uuid[];
    v_bid_ids            uuid[];

    v_status             text;
    v_selling_method     text;
    v_money_divisor       numeric;
    v_random              numeric;
BEGIN
    -- Convert configured money values to major units before storing them in NUMERIC columns.
    -- This lets the same seed use either human-readable UAH or integer kopecks.
    IF v_price_mode NOT IN ('major', 'minor') THEN
        RAISE EXCEPTION 'v_price_mode must be major or minor, got: %', v_price_mode;
    END IF;

    v_money_divisor := CASE v_price_mode WHEN 'minor' THEN v_minor_units_per_major ELSE 1 END;

    -- ------------------------------------------------------------
    -- Safety: the script assumes an empty/test database.
    -- It does not truncate existing data.
    -- ------------------------------------------------------------

    -- ------------------------------------------------------------
    -- Categories
    -- ------------------------------------------------------------
    -- Root categories are inserted first, followed by children.
    INSERT INTO categories (category_id, parent_category_id, name)
    VALUES
        (uuidv7(), NULL, 'Електроніка'),
        (uuidv7(), NULL, 'Одяг та взуття'),
        (uuidv7(), NULL, 'Дім і сад'),
        (uuidv7(), NULL, 'Спорт та відпочинок'),
        (uuidv7(), NULL, 'Транспорт'),
        (uuidv7(), NULL, 'Книги та хобі'),
        (uuidv7(), NULL, 'Дитячі товари'),
        (uuidv7(), NULL, 'Побутова техніка'),
        (uuidv7(), NULL, 'Інструменти'),
        (uuidv7(), NULL, 'Інше');

    -- Add one level of child categories.
    FOR v_i IN 1..10 LOOP
        SELECT category_id
        INTO v_category_id
        FROM categories
        WHERE parent_category_id IS NULL
        ORDER BY category_id
        OFFSET v_i - 1
        LIMIT 1;

        INSERT INTO categories (category_id, parent_category_id, name)
        VALUES
            (uuidv7(), v_category_id,
             CASE v_i
                 WHEN 1 THEN 'Смартфони та аксесуари'
                 WHEN 2 THEN 'Чоловічий та жіночий одяг'
                 WHEN 3 THEN 'Меблі та декор'
                 WHEN 4 THEN 'Велосипеди та спорядження'
                 WHEN 5 THEN 'Автотовари'
                 WHEN 6 THEN 'Книги та настільні ігри'
                 WHEN 7 THEN 'Іграшки'
                 WHEN 8 THEN 'Техніка для кухні'
                 WHEN 9 THEN 'Ручний та електричний інструмент'
                 ELSE 'Товари різного призначення'
             END);
    END LOOP;

    -- ------------------------------------------------------------
    -- Customers: exactly 10 names x 10 surnames = 100 users.
    -- Emails use _, -, or a number from 1..10 as requested.
    -- ------------------------------------------------------------
    FOR v_i IN 1..array_length(v_names, 1) LOOP
        FOR v_j IN 1..array_length(v_surnames, 1) LOOP
            v_first_name := v_names[v_i];
            v_last_name := v_surnames[v_j];

            -- Use Latin transliteration-like identifiers for emails.
            -- The combination of first/surname + delimiter + index is unique.
            -- 3 delimiter variants: '_' and '-' plus a number from 1..10.
            -- The modulo keeps the choice cycling through these variants.
            v_delimiter :=
                CASE ((v_i + v_j) % 3)
                    WHEN 0 THEN '_'
                    WHEN 1 THEN '-'
                    ELSE ((v_i + v_j - 1) % 10 + 1)::text
                END;

            v_email := lower(
                CASE v_i
                    WHEN 1 THEN 'oleksandr'
                    WHEN 2 THEN 'andrii'
                    WHEN 3 THEN 'maksym'
                    WHEN 4 THEN 'dmytro'
                    WHEN 5 THEN 'ivan'
                    WHEN 6 THEN 'mykola'
                    WHEN 7 THEN 'bohdan'
                    WHEN 8 THEN 'taras'
                    WHEN 9 THEN 'artem'
                    ELSE 'roman'
                END
                || v_delimiter ||
                CASE v_j
                    WHEN 1 THEN 'shevchenko'
                    WHEN 2 THEN 'kovalenko'
                    WHEN 3 THEN 'bondarenko'
                    WHEN 4 THEN 'melnyk'
                    WHEN 5 THEN 'tkachenko'
                    WHEN 6 THEN 'kravchenko'
                    WHEN 7 THEN 'oliinyk'
                    WHEN 8 THEN 'polishchuk'
                    WHEN 9 THEN 'lysenko'
                    ELSE 'savchenko'
                END
            );

            -- Add a deterministic suffix only where the delimiter is a number.
            IF v_delimiter ~ '^[0-9]+$' THEN
                v_email := v_email || '@example.com';
            ELSE
                v_email := v_email || '@example.com';
            END IF;

            INSERT INTO users (
                user_id, email, name, phone, user_role
            )
            VALUES (
                uuidv7(),
                v_email,
                v_first_name || ' ' || v_last_name,
                NULL,
                'customer'
            );
        END LOOP;
    END LOOP;

    -- ------------------------------------------------------------
    -- Admins: generated separately.
    -- ------------------------------------------------------------
    FOR v_i IN 1..5 LOOP
        INSERT INTO users (
            user_id, email, name, phone, user_role
        )
        VALUES (
            uuidv7(),
            'admin' || v_i || '@example.com',
            CASE v_i
                WHEN 1 THEN 'Адміністратор Олег'
                WHEN 2 THEN 'Адміністратор Наталія'
                WHEN 3 THEN 'Адміністратор Сергій'
                WHEN 4 THEN 'Адміністратор Ірина'
                ELSE 'Адміністратор Павло'
            END,
            NULL,
            'admin'
        );
    END LOOP;

    SELECT array_agg(user_id ORDER BY user_id)
    INTO v_customer_ids
    FROM users
    WHERE user_role = 'customer';

    SELECT array_agg(user_id ORDER BY user_id)
    INTO v_admin_ids
    FROM users
    WHERE user_role = 'admin';

    -- ------------------------------------------------------------
    -- Listings
    -- ------------------------------------------------------------
    -- Most listings have ordinary prices; v_low_price_percent are
    -- deliberately concentrated in a tiny price range.
    --
    -- Selling methods:
    --   fixed_price -> majority
    --   best_offer  -> some
    --   auction     -> some
    --
    -- Auction listings are populated later.
    -- ------------------------------------------------------------
    FOR v_i IN 1..v_listing_count LOOP
        v_listing_id := uuidv7();

        -- Cycle through all categories instead of repeatedly sorting/selecting
        -- a random category. Modulo converts the listing number into a category index.
        SELECT category_id
        INTO v_category_id
        FROM categories
        ORDER BY category_id
        OFFSET ((v_i - 1) % (SELECT count(*) FROM categories))
        LIMIT 1;

        -- Cycle through the 100 customers so every customer gets listings.
        -- +1 is needed because PostgreSQL arrays are 1-based.
        v_seller_id := v_customer_ids[((v_i - 1) % array_length(v_customer_ids, 1)) + 1];

        -- random() is in [0, 1); multiplying by 100 turns it into a percentage.
        -- This makes approximately v_low_price_percent of listings low-priced.
        IF random() * 100 < v_low_price_percent THEN
            -- Pick a random value inside the configured low-price range.
            -- Division converts minor-unit configuration (e.g. kopecks) to UAH.
            v_price := round(
                (v_low_price_min +
                random() * (v_low_price_max - v_low_price_min))::numeric / v_money_divisor
            , 2);
        ELSE
            -- Pick a random value inside the normal-price range, then convert it
            -- to major currency units if the configuration is expressed in minor units.
            v_price := round(
                (v_normal_price_min +
                random() * (v_normal_price_max - v_normal_price_min))::numeric / v_money_divisor
            , 2);
        END IF;

        -- 70% fixed price, next 18% best offer, remaining 12% auction.
        -- The second threshold is cumulative: random() < 0.88 includes the first 70%.
        v_selling_method :=
            CASE
                WHEN random() < 0.70 THEN 'fixed_price'
                WHEN random() < 0.88 THEN 'best_offer'
                ELSE 'auction'
            END;

        v_listing_title :=
            CASE ((v_i - 1) % 10)
                WHEN 0 THEN 'Смартфон у відмінному стані'
                WHEN 1 THEN 'Ноутбук для роботи та навчання'
                WHEN 2 THEN 'Велосипед міський'
                WHEN 3 THEN 'Кавоварка для дому'
                WHEN 4 THEN 'Куртка демісезонна'
                WHEN 5 THEN 'Набір ручного інструменту'
                WHEN 6 THEN 'Настільна гра для компанії'
                WHEN 7 THEN 'Офісне крісло'
                WHEN 8 THEN 'Навушники бездротові'
                ELSE 'Товар для дому'
            END
            || ' №' || v_i;

        INSERT INTO listings (
            listing_id,
            user_id,
            category_id,
            title,
            item_condition,
            selling_method,
            description,
            price,
            currency,
            quantity,
            status
        )
        VALUES (
            v_listing_id,
            v_seller_id,
            v_category_id,
            v_listing_title,
            CASE WHEN random() < 0.55 THEN 'used' ELSE 'new' END,
            v_selling_method,
            'Якісний товар. Детальний опис буде доступний покупцю перед оформленням замовлення.',
            v_price,
            'UAH',
            1 + floor(random() * 5)::integer,
            'active'
        );
    END LOOP;

    SELECT array_agg(listing_id ORDER BY created_at, listing_id)
    INTO v_listing_ids
    FROM listings;

    -- ------------------------------------------------------------
    -- Admin reviews
    -- ------------------------------------------------------------
    -- Every listing receives one accepted review, so listings look
    -- like they passed moderation.
    -- ------------------------------------------------------------
    INSERT INTO listing_admin_reviews (
        listing_id, admin_id, status, decline_reason, reviewed_at
    )
    SELECT
        l.listing_id,
        v_admin_ids[((row_number() OVER (ORDER BY l.listing_id) - 1)
                     % array_length(v_admin_ids, 1)) + 1],
        'accept',
        NULL,
        l.created_at + interval '1 hour'
    FROM listings l;

    -- ------------------------------------------------------------
    -- Auctions
    -- ------------------------------------------------------------
    -- Approximately 12% of listings are auctions.
    -- Finished auctions receive bids. Some are finished without bids.
    -- current_bid is filled after bids exist because auctions.current_bid
    -- references bids.bid_id.
    -- ------------------------------------------------------------
    FOR v_i IN 1..v_listing_count LOOP
        SELECT listing_id, price
        INTO v_listing_id, v_price
        FROM listings
        WHERE selling_method = 'auction'
        ORDER BY listing_id
        OFFSET v_i - 1
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        v_auc_id := uuidv7();

        INSERT INTO auctions (
            auc_id,
            listing_id,
            status,
            start_price,
            reserve_price,
            current_price,
            current_bid,
            start_at,
            end_at
        )
        VALUES (
            v_auc_id,
            v_listing_id,
            'finished',
            -- Start at 70% of the listing price, but never below 1 UAH.
            -- 70% gives auctions room to receive higher bids.
            greatest(1, round(v_price * 0.70, 2)),
            -- Reserve price is 80% of the listing price.
            round(v_price * 0.80, 2),
            NULL,
            NULL,
            v_now - interval '30 days' + ((v_i % 20) || ' hours')::interval,
            v_now - interval '29 days' + ((v_i % 20) || ' hours')::interval
        );
    END LOOP;

    -- ------------------------------------------------------------
    -- Bids
    -- ------------------------------------------------------------
    -- Generate bids for most auctions. A few auctions intentionally
    -- remain without bids to test "auction expired with no bids".
    -- ------------------------------------------------------------
    FOR v_i IN 1..(SELECT count(*) FROM auctions) LOOP
        SELECT auc_id, start_price
        INTO v_auc_id, v_price
        FROM auctions
        ORDER BY auc_id
        OFFSET v_i - 1
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        IF v_i % 10 <> 0 THEN
            -- Two bids per auction.
            FOR v_j IN 1..2 LOOP
                v_bid_id := uuidv7();

                -- +7 shifts the deterministic customer sequence so auction bidders
                -- are not always the same customer as the auction's seller.
                -- Modulo wraps the index back into the 100-customer array.
                v_buyer_id := v_customer_ids[
                    ((v_i + v_j + 7) % array_length(v_customer_ids, 1)) + 1
                ];

                INSERT INTO bids (
                    bid_id,
                    auc_id,
                    bidder_id,
                    status,
                    max_amount,
                    created_at
                )
                VALUES (
                    v_bid_id,
                    v_auc_id,
                    v_buyer_id,
                    CASE WHEN v_j = 1 THEN 'outbidded' ELSE 'active' END,
                    -- Bid 1 is 115% of the start price; bid 2 is 125%.
                    -- 1.05 + (1 or 2) * 0.10 creates increasing bids for the two bidders.
                    round((v_price * (1.05 + v_j * 0.10))::numeric, 2),
                    v_now - interval '28 days' + ((v_i + v_j) % 100) * interval '1 minute'
                );

                -- Keep the second bid as current_bid.
                IF v_j = 2 THEN
                    UPDATE auctions
                    -- The second bid is the highest generated bid, so it becomes current.
                    SET current_price = round((v_price * 1.25)::numeric, 2),
                        current_bid = v_bid_id
                    WHERE auc_id = v_auc_id;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- ------------------------------------------------------------
    -- Offers
    -- ------------------------------------------------------------
    -- Best-offer listings receive a small conversation-like offer chain.
    -- There is no 'countered' status: every offer is either accepted or rejected.
    --
    -- Example sequence:
    --   1. buyer -> seller: 90% of asking price -> rejected
    --   2. seller -> buyer: 95% of asking price -> rejected
    --   3. buyer -> seller: 92.5% of asking price -> accepted
    --
    -- 'offered_by' identifies who made each offer. This models a counteroffer
    -- without needing a separate status or counteroffer column.
    -- ------------------------------------------------------------
    FOR v_i IN 1..v_listing_count LOOP
        SELECT listing_id, price, user_id
        INTO v_listing_id, v_price, v_seller_id
        FROM listings
        WHERE selling_method = 'best_offer'
        ORDER BY listing_id
        OFFSET v_i - 1
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        -- +13 shifts the buyer sequence relative to listing/seller assignment.
        -- Modulo wraps the position into the 100-customer array; +1 converts
        -- the zero-based modulo result to PostgreSQL's 1-based array index.
        v_buyer_id := v_customer_ids[
            ((v_i + 13) % array_length(v_customer_ids, 1)) + 1
        ];

        -- Make sure the buyer is not the seller of this listing.
        IF v_buyer_id = v_seller_id THEN
            -- +14 moves to the next customer in the deterministic sequence.
            v_buyer_id := v_customer_ids[
                ((v_i + 14) % array_length(v_customer_ids, 1)) + 1
            ];
        END IF;

        -- Initial buyer offer: 90% of the asking price.
        INSERT INTO offers (
            offer_id, listing_id, offered_by, price, status
        )
        VALUES (
            uuidv7(),
            v_listing_id,
            v_buyer_id,
            round((v_price * 0.90)::numeric, 2),
            'rejected'
        );

        -- Every third best-offer listing gets a seller counteroffer.
        IF v_i % 3 = 0 THEN
            INSERT INTO offers (
                offer_id, listing_id, offered_by, price, status
            )
            VALUES (
                uuidv7(),
                v_listing_id,
                v_seller_id,
                -- Seller moves the price up to 95% of asking price.
                round((v_price * 0.95)::numeric, 2),
                'rejected'
            );

            -- The buyer then makes a counteroffer of 92.5%.
            -- It is accepted to provide examples of successful negotiations.
            INSERT INTO offers (
                offer_id, listing_id, offered_by, price, status
            )
            VALUES (
                uuidv7(),
                v_listing_id,
                v_buyer_id,
                -- 92.5% is halfway between the buyer's initial 90% and
                -- seller's 95% counteroffer.
                round((v_price * 0.925)::numeric, 2),
                'accepted'
            );
        END IF;
    END LOOP;

    -- ------------------------------------------------------------
    -- Orders
    -- ------------------------------------------------------------
    -- One order line per order keeps the large-volume seed fast and
    -- deterministic. Each order references a real listing.
    --
    -- Listings are selected independently for each order, so the same listing
    -- may receive many orders and some listings may receive none. With the default
    -- skew of 2.0, lower-positioned listings intentionally receive more orders.
    -- ------------------------------------------------------------
    FOR v_i IN 1..v_order_count LOOP
        -- Pick a listing using a configurable skew instead of a one-to-one mapping.
        -- random() ^ 2.0 favors lower array positions, so some listings receive
        -- many orders while others receive few; set v_order_listing_skew to 1.0
        -- when an approximately uniform distribution is preferred.
        v_listing_id := v_listing_ids[
            floor(power(random(), v_order_listing_skew) * array_length(v_listing_ids, 1))::integer + 1
        ];

        SELECT user_id, title, price
        INTO v_seller_id, v_listing_title, v_price
        FROM listings
        WHERE listing_id = v_listing_id;

        -- *17 and +3 create a deterministic but less obvious buyer sequence,
        -- distributing orders across customers without an extra random lookup.
        -- Modulo wraps the result into the customer array; +1 converts to a
        -- PostgreSQL 1-based array index.
        v_buyer_id := v_customer_ids[
            ((v_i * 17 + 3) % array_length(v_customer_ids, 1)) + 1
        ];

        -- Avoid buyer = seller.
        IF v_buyer_id = v_seller_id THEN
            -- If the generated buyer is also the seller, move one position forward.
            -- +4 is therefore the +3 sequence's next customer.
            v_buyer_id := v_customer_ids[
                ((v_i * 17 + 4) % array_length(v_customer_ids, 1)) + 1
            ];
        END IF;

        -- Generate an order amount inside the configured range, then convert
        -- minor-unit configuration (e.g. kopecks) to UAH. The listing price is
        -- the upper bound so an order does not exceed the selected listing price.
        v_quantity := 1;
        v_order_amount := round(
            greatest(
                0.01,
                least(
                    v_price,
                    (v_order_amount_min +
                     random() * (v_order_amount_max - v_order_amount_min))::numeric / v_money_divisor
                )
            ),
            2
        );

        v_order_id := uuidv7();

        -- Target distribution: 90% completed, 6% cancelled, 4% pending.
        -- Store one random value so the thresholds are cumulative and keep these
        -- percentages exact in expectation rather than conditional on another random draw.
        v_random := random();
        v_status := CASE
            WHEN v_random < 0.90 THEN 'completed'
            WHEN v_random < 0.96 THEN 'cancelled'
            ELSE 'pending'
        END;

        INSERT INTO orders (
            order_id,
            buyer_id,
            seller_id,
            status,
            sub_total,
            total,
            currency
        )
        VALUES (
            v_order_id,
            v_buyer_id,
            v_seller_id,
            v_status,
            v_order_amount,
            v_order_amount,
            'UAH'
        );

        INSERT INTO order_lines (
            order_id,
            listing_id,
            unit_price,
            discount_amount,
            final_unit_price,
            currency,
            quantity,
            listing_title
        )
        VALUES (
            v_order_id,
            v_listing_id,
            v_order_amount,
            0,
            v_order_amount,
            'UAH',
            v_quantity,
            v_listing_title
        );

        INSERT INTO payments (
            order_id,
            payment_method,
            payment_status,
            card_last4,
            amount,
            currency,
            payed_at
        )
        VALUES (
            v_order_id,
            'credit_card',
            CASE WHEN v_status = 'completed' THEN 'paid' ELSE 'pending' END,
            -- Generate a four-digit test card suffix in the 1000..9999 range.
            lpad((1000 + (v_i % 9000))::text, 4, '0'),
            v_order_amount,
            'UAH',
            CASE WHEN v_status = 'completed'
                 THEN v_now - ((v_i % 365) || ' days')::interval
                 ELSE NULL
            END
        );

        -- Most completed orders get a rating.
        -- Only completed orders can have a buyer rating.
        IF v_status = 'completed' AND v_i % 5 <> 0 THEN
            INSERT INTO order_rating (
                rating_id,
                order_id,
                buyer_id,
                rating,
                review
            )
            VALUES (
                uuidv7(),
                v_order_id,
                v_buyer_id,
                3 + (v_i % 3),
                CASE (v_i % 5)
                    WHEN 0 THEN 'Все добре.'
                    WHEN 1 THEN 'Товар відповідає опису.'
                    WHEN 2 THEN 'Швидка доставка.'
                    WHEN 3 THEN 'Задоволений покупкою.'
                    ELSE 'Гарний продавець.'
                END
            );
        END IF;
    END LOOP;

    -- ------------------------------------------------------------
    -- Chats and messages
    -- ------------------------------------------------------------
    -- Keep these much smaller than orders/listings; they are intended
    -- as representative relational test data rather than a huge load.
    -- ------------------------------------------------------------
    FOR v_i IN 1..least(5000, v_order_count) LOOP
        -- Select an existing order directly. Using the listing array here avoids
        -- stale NULL variables when a SELECT ... INTO finds no row.
        v_listing_id := v_listing_ids[
            ((v_i * 37 + 11) % array_length(v_listing_ids, 1)) + 1
        ];

        SELECT o.order_id, o.buyer_id, o.seller_id
        INTO v_order_id, v_buyer_id, v_seller_id
        FROM orders o
        JOIN order_lines ol ON ol.order_id = o.order_id
        WHERE ol.listing_id = v_listing_id
        ORDER BY o.created_at, o.order_id
        LIMIT 1;

        -- The order must exist because orders are generated from v_listing_ids.
        CONTINUE WHEN NOT FOUND;

        v_chat_id := uuidv7();

        INSERT INTO chats (
            chat_id,
            listing_id,
            buyer_id,
            seller_id
        )
        VALUES (
            v_chat_id,
            v_listing_id,
            v_buyer_id,
            v_seller_id
        );

        INSERT INTO chat_messages (
            message_id,
            chat_id,
            sender_id,
            receiver_id,
            message
        )
        VALUES (
            uuidv7(),
            v_chat_id,
            v_buyer_id,
            v_seller_id,
            'Добрий день! Чи актуальне оголошення?'
        );

        INSERT INTO chat_messages (
            message_id,
            chat_id,
            sender_id,
            receiver_id,
            message
        )
        VALUES (
            uuidv7(),
            v_chat_id,
            v_seller_id,
            v_buyer_id,
            'Так, товар доступний. Можу відповісти на ваші запитання.'
        );
    END LOOP;

    -- ------------------------------------------------------------
    -- Favourite listings
    -- ------------------------------------------------------------
    -- A moderate amount of many-to-many data.
    -- ON CONFLICT makes this safe if the deterministic combination
    -- happens to collide.
    -- ------------------------------------------------------------
    FOR v_i IN 1..5000 LOOP
        -- Multipliers 7 and 19 produce deterministic permutations through the
        -- customer/listing arrays, reducing repetitive user-listing combinations.
        -- +1 converts the zero-based modulo result to a PostgreSQL array index.
        v_buyer_id := v_customer_ids[((v_i * 7) % array_length(v_customer_ids, 1)) + 1];
        v_listing_id := v_listing_ids[((v_i * 19) % array_length(v_listing_ids, 1)) + 1];

        INSERT INTO favourite_listings (user_id, listing_id)
        VALUES (v_buyer_id, v_listing_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Seed completed: % customers, % admins, % listings, % orders.',
        (SELECT count(*) FROM users WHERE user_role = 'customer'),
        (SELECT count(*) FROM users WHERE user_role = 'admin'),
        (SELECT count(*) FROM listings),
        (SELECT count(*) FROM orders);
END $$;



VACUUM (ANALYZE);


-- Useful verification queries:
--
-- SELECT user_role, count(*) FROM users GROUP BY user_role;
-- SELECT count(*) FROM listings;
-- SELECT count(*) FROM orders;
-- SELECT status, count(*) FROM orders GROUP BY status;
-- SELECT selling_method, count(*) FROM listings GROUP BY selling_method;
-- SELECT count(*) FROM listings WHERE price < 20;
-- SELECT min(price), max(price), avg(price) FROM listings;
-- SELECT count(*) FROM auctions;
-- SELECT count(*) FROM bids;
-- SELECT count(*) FROM offers;
-- SELECT count(*) FROM payments WHERE payment_status = 'paid';
