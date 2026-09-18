-- DROP SCHEMA IF EXISTS develop CASCADE;
-- CREATE SCHEMA IF NOT EXISTS develop;
-- SET search_path TO develop;

CREATE COLLATION IF NOT EXISTS "uk_UA" (provider = icu, locale = 'uk-UA');

CREATE TABLE IF NOT EXISTS users (
    user_id uuid PRIMARY KEY,
    email varchar(254) NOT NULL UNIQUE,
    email_verified_at timestamptz,
    name text NOT NULL,
    password_hash text,
    password_salt text,
    phone text,
    user_role text NOT NULL CHECK (user_role IN ('admin', 'customer')),
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    category_id uuid PRIMARY KEY,
    parent_category_id uuid REFERENCES categories (category_id),
    name text NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
    listing_id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users (user_id),
    category_id uuid NOT NULL REFERENCES categories (category_id),
    title text NOT NULL,
    item_condition text NOT NULL CHECK (item_condition IN ('new', 'used')),
    selling_method text NOT NULL CHECK (selling_method IN ('fixed_price', 'best_offer', 'auction')),
    description text NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    currency text NOT NULL CHECK (length(currency) = 3),
    quantity int NOT NULL CHECK (quantity > 0),
    status text NOT NULL CHECK (status IN ('on_review', 'declined', 'active', 'inactive')),
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz,
    -- full text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(title, '')) ||
        to_tsvector('simple', coalesce(description, ''))
    ) STORED
);

CREATE TABLE IF NOT EXISTS listing_admin_reviews (
    listing_id uuid REFERENCES listings (listing_id),
    admin_id uuid REFERENCES users (user_id),
    status text NOT NULL CHECK (status IN ('accept', 'decline')),
    decline_reason text,
    reviewed_at timestamptz NOT NULL,
    PRIMARY KEY (listing_id, admin_id),
    CONSTRAINT check_decline_has_reason CHECK (status != 'decline' OR decline_reason IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS auctions (
    auc_id uuid PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings (listing_id),
    status text NOT NULL CHECK (status IN ('created', 'active', 'finished', 'cancelled')),
    start_price NUMERIC NOT NULL CHECK (start_price > 0),
    reserve_price NUMERIC NOT NULL CHECK (reserve_price >= 0) DEFAULT 0,
    current_price NUMERIC CHECK (current_price > 0),
    current_bid uuid,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    cancel_reason text,
    created_at timestamptz DEFAULT now() NOT NULL,
    CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS bids (
    bid_id uuid PRIMARY KEY,
    auc_id uuid NOT NULL REFERENCES auctions (auc_id),
    bidder_id uuid NOT NULL REFERENCES users (user_id),
    status text NOT NULL CHECK (status IN ('active', 'outbidded', 'cancelled')),
    max_amount NUMERIC NOT NULL CHECK (max_amount > 0),
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE auctions ADD CONSTRAINT fk_auctions_bids FOREIGN KEY (current_bid) REFERENCES bids (bid_id);

CREATE TABLE IF NOT EXISTS offers (
    offer_id uuid PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings (listing_id),
    offered_by uuid NOT NULL REFERENCES users (user_id),
    price NUMERIC NOT NULL CHECK (price >= 0),
    status text NOT NULL CHECK (status IN ('rejected', 'accepted', 'cancelled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS chats (
    chat_id uuid PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings (listing_id),
    buyer_id uuid NOT NULL REFERENCES users (user_id),
    seller_id uuid NOT NULL REFERENCES users (user_id),
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id uuid PRIMARY KEY,
    chat_id uuid NOT NULL REFERENCES chats (chat_id),
    sender_id uuid NOT NULL REFERENCES users (user_id),
    receiver_id uuid NOT NULL REFERENCES users (user_id),
    offer_id uuid REFERENCES offers (offer_id),
    message text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS discounts (
    discount_id uuid PRIMARY KEY,
    name text NOT NULL,
    discount_type text NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC CHECK (min_order_amount >= 0) DEFAULT 0,
    currency text CHECK (length(currency) = 3),
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    is_active bool NOT NULL DEFAULT FALSE,
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz,
    CHECK (end_at > start_at),
    CONSTRAINT check_fixed_discount_has_currency CHECK (discount_type != 'fixed' OR currency IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS discount_targets (
    discount_target_id uuid PRIMARY KEY,
    discount_id uuid NOT NULL REFERENCES discounts (discount_id),
    target_type text NOT NULL CHECK (target_type IN ('cart', 'category')),
    target_category_id uuid REFERENCES categories (category_id)
    CONSTRAINT check_category_discount_has_cat_id CHECK (target_type != 'category' OR target_category_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS coupons (
    coupon_id uuid PRIMARY KEY,
    discount_id uuid NOT NULL REFERENCES discounts (discount_id),
    code text NOT NULL,
    description text,
    max_usage_per_user int NOT NULL CHECK (max_usage_per_user > 0) DEFAULT 1,
    max_usage int CHECK (max_usage >= 0),
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS orders (
    order_id uuid PRIMARY KEY,
    buyer_id uuid NOT NULL REFERENCES users (user_id),
    seller_id uuid NOT NULL REFERENCES users (user_id),
    status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'awaiting_payment', 'delivering', 'delivered', 'completed', 'cancelled')),
    sub_total NUMERIC NOT NULL CHECK (sub_total >= 0),
    total NUMERIC NOT NULL CHECK (total >= 0),
    currency text NOT NULL CHECK (length(currency) = 3),
    coupon_id uuid REFERENCES coupons (coupon_id),
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS order_lines (
    order_id uuid REFERENCES orders (order_id),
    listing_id uuid REFERENCES listings (listing_id),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC NOT NULL CHECK (discount_amount >= 0) DEFAULT 0,
    final_unit_price NUMERIC NOT NULL CHECK (final_unit_price >= 0),
    currency text NOT NULL CHECK (length(currency) = 3),
    quantity SMALLINT NOT NULL CHECK (quantity > 0),
    listing_title text NOT NULL,
    PRIMARY KEY (order_id, listing_id)
);

CREATE TABLE IF NOT EXISTS payments (
    order_id uuid PRIMARY KEY REFERENCES orders (order_id),
    payment_method text NOT NULL CHECK (payment_method IN ('credit_card')) DEFAULT 'credit_card',
    payment_status text NOT NULL CHECK (payment_status IN ('pending', 'paid')),
    card_last4 text CHECK (length(card_last4) = 4),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency text NOT NULL CHECK (length(currency) = 3),
    payed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS favourite_listings (
    user_id uuid REFERENCES users (user_id),
    listing_id uuid REFERENCES listings (listing_id),
    PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS order_rating (
    rating_id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders (order_id),
    buyer_id uuid NOT NULL REFERENCES users (user_id),
    rating SMALLINT NOT NULL CHECK (rating > 0 AND rating <= 5),
    review text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS carts (
    cart_id uuid PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS cart_details (
    cart_id uuid REFERENCES carts (cart_id),
    listing_id uuid REFERENCES listings (listing_id),
    quantity SMALLINT NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (cart_id, listing_id)
);
