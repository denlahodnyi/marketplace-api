import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1790449450837 implements MigrationInterface {
    name = 'Initial1790449450837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "category_id" uuid NOT NULL DEFAULT uuidv7(),
                "name" text NOT NULL,
                "parent_category_id" uuid,
                CONSTRAINT "REL_de08738901be6b34d2824a1e24" UNIQUE ("parent_category_id"),
                CONSTRAINT "PK_51615bef2cea22812d0dcab6e18" PRIMARY KEY ("category_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "user_id" uuid NOT NULL DEFAULT uuidv7(),
                "email" character varying(254) NOT NULL,
                "email_verified_at" TIMESTAMP WITH TIME ZONE,
                "name" text NOT NULL,
                "password_hash" text,
                "password_salt" text,
                "phone" text,
                "user_role" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "CHK_a984eee989ed779052f26470b3" CHECK ("user_role" IN ('admin', 'customer')),
                CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES ($1, $2, $3, $4, $5, $6)
        `, ["market","public","listings","GENERATED_COLUMN","search_vector","to_tsvector('simple', coalesce(\"title\", '')) || to_tsvector('simple', coalesce(\"description\", ''))"]);
        await queryRunner.query(`
            CREATE TABLE "listings" (
                "listing_id" uuid NOT NULL DEFAULT uuidv7(),
                "user_id" uuid NOT NULL,
                "category_id" uuid NOT NULL,
                "title" text NOT NULL,
                "item_condition" text NOT NULL,
                "selling_method" text NOT NULL,
                "description" text NOT NULL,
                "price" integer NOT NULL,
                "currency" text NOT NULL,
                "quantity" integer NOT NULL,
                "status" text NOT NULL,
                "search_vector" tsvector GENERATED ALWAYS AS (
                    to_tsvector('simple', coalesce("title", '')) || to_tsvector('simple', coalesce("description", ''))
                ) STORED NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_91bf96160028f9cdfe08afc9c5" CHECK (
                    "status" IN ('on_review', 'declined', 'active', 'inactive')
                ),
                CONSTRAINT "CHK_d1b098eabeed751cc655efcc48" CHECK ("quantity" > 0),
                CONSTRAINT "CHK_4852906208563659d59cce46c9" CHECK (length("currency") = 3),
                CONSTRAINT "CHK_59acc2dd3f3e14cd50b123e6c5" CHECK ("price" >= 0),
                CONSTRAINT "CHK_1fa14f5131ffcc0b14cbcd53db" CHECK (
                    "selling_method" IN ('fixed_price', 'best_offer', 'auction')
                ),
                CONSTRAINT "CHK_18b1fc732991a442ca730f6ad5" CHECK ("item_condition" IN ('new', 'used')),
                CONSTRAINT "PK_9cac2c3ec39ee9b17a76fba0047" PRIMARY KEY ("listing_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9ef4b09d61280166740c65fe8b" ON "listings" USING gin ("search_vector")
        `);
        await queryRunner.query(`
            CREATE TABLE "auctions" (
                "auc_id" uuid NOT NULL DEFAULT uuidv7(),
                "listing_id" uuid NOT NULL,
                "status" text NOT NULL,
                "start_price" integer NOT NULL,
                "reserve_price" integer NOT NULL DEFAULT '0',
                "current_price" integer,
                "current_bid" uuid,
                "start_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "cancel_reason" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "REL_61c3c7369072cc460c44fc98b9" UNIQUE ("current_bid"),
                CONSTRAINT "CHK_366282fbc7120f6848805d1fc2" CHECK ("end_at" > "start_at"),
                CONSTRAINT "CHK_b26eb1ad5f7cbcbd478b711671" CHECK ("current_price" > 0),
                CONSTRAINT "CHK_73c5ef5af072d8ad8dea3a9ef3" CHECK ("reserve_price" >= 0),
                CONSTRAINT "CHK_d2d3e3ce176370045d32b2a47d" CHECK ("start_price" > 0),
                CONSTRAINT "CHK_34d270177216b8f438e80cf7bd" CHECK (
                    "status" IN ('created', 'active', 'finished', 'cancelled')
                ),
                CONSTRAINT "PK_63d474ed5b139e396bbd493cdd8" PRIMARY KEY ("auc_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "bids" (
                "bid_id" uuid NOT NULL DEFAULT uuidv7(),
                "auction_id" uuid NOT NULL,
                "bidder_id" uuid NOT NULL,
                "status" text NOT NULL,
                "max_amount" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "CHK_6e1972293bc1281510853298e5" CHECK ("max_amount" > 0),
                CONSTRAINT "CHK_5746791c7c8336b102ced9bbf0" CHECK ("status" IN ('active', 'outbidded', 'cancelled')),
                CONSTRAINT "PK_7729bc1896e2c415e5e4a5091a7" PRIMARY KEY ("bid_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "cart_details" (
                "cart_id" uuid NOT NULL DEFAULT uuidv7(),
                "listing_id" uuid NOT NULL DEFAULT uuidv7(),
                "quantity" smallint NOT NULL,
                CONSTRAINT "CHK_1037307cbec34d86538e48026e" CHECK ("quantity" > 0),
                CONSTRAINT "PK_d69b178ac32aeb5909c010f1838" PRIMARY KEY ("cart_id", "listing_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "carts" (
                "cart_id" uuid NOT NULL DEFAULT uuidv7(),
                "user_id" uuid NOT NULL,
                CONSTRAINT "UQ_2ec1c94a977b940d85a4f498aea" UNIQUE ("user_id"),
                CONSTRAINT "REL_2ec1c94a977b940d85a4f498ae" UNIQUE ("user_id"),
                CONSTRAINT "PK_2fb47cbe0c6f182bb31c66689e9" PRIMARY KEY ("cart_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "chats" (
                "chat_id" uuid NOT NULL DEFAULT uuidv7(),
                "listing_id" uuid NOT NULL,
                "buyer_id" uuid NOT NULL,
                "seller_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_cb573d310bde330521e7715db2a" PRIMARY KEY ("chat_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "favourite_listings" (
                "user_id" uuid NOT NULL DEFAULT uuidv7(),
                "listing_id" uuid NOT NULL DEFAULT uuidv7(),
                CONSTRAINT "PK_5e234a0c097b6acef08913c47f0" PRIMARY KEY ("user_id", "listing_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "listing_admin_reviews" (
                "listing_id" uuid NOT NULL DEFAULT uuidv7(),
                "admin_id" uuid NOT NULL DEFAULT uuidv7(),
                "status" text NOT NULL,
                "decline_reason" text,
                "reviewed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "CHK_e86eac968f12032374c886dfd1" CHECK ("status" IN ('accept', 'decline')),
                CONSTRAINT "check_decline_has_reason" CHECK (
                    "status" != 'decline'
                    OR "decline_reason" IS NOT NULL
                ),
                CONSTRAINT "PK_dd13c1eddb5e46585872db37bdb" PRIMARY KEY ("listing_id", "admin_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "offers" (
                "offer_id" uuid NOT NULL DEFAULT uuidv7(),
                "listing_id" uuid NOT NULL,
                "offered_by" uuid NOT NULL,
                "price" integer NOT NULL,
                "status" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_2c31f6b9fc42aa90039253b785" CHECK (
                    "status" IN ('rejected', 'accepted', 'cancelled')
                ),
                CONSTRAINT "CHK_d4e22d25073ada6d3f096c883d" CHECK ("price" >= 0),
                CONSTRAINT "PK_d611e618dbf3754ffb7fc1ffb38" PRIMARY KEY ("offer_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "message_id" uuid NOT NULL DEFAULT uuidv7(),
                "sender_id" uuid NOT NULL,
                "receiver_id" uuid NOT NULL,
                "offer_id" uuid,
                "message" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "chat_id" uuid NOT NULL,
                CONSTRAINT "REL_43d935655c84101ca66b80739b" UNIQUE ("offer_id"),
                CONSTRAINT "PK_300f1fa55a5fffb36c7763b2de8" PRIMARY KEY ("message_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "order_lines" (
                "order_id" uuid NOT NULL DEFAULT uuidv7(),
                "listing_id" uuid NOT NULL DEFAULT uuidv7(),
                "unit_price" integer NOT NULL,
                "discount_amount" integer NOT NULL DEFAULT '0',
                "final_unit_price" integer NOT NULL,
                "currency" text NOT NULL,
                "quantity" smallint NOT NULL,
                "listing_title" text NOT NULL,
                CONSTRAINT "CHK_3eda4fd18993fd974fe7d7fabb" CHECK ("quantity" > 0),
                CONSTRAINT "CHK_9c87fb068bd12cffd5addbc92e" CHECK (length("currency") = 3),
                CONSTRAINT "CHK_8a98092cbe6153c35068531db0" CHECK ("final_unit_price" >= 0),
                CONSTRAINT "CHK_6c72a251a3ec1168c178122dd6" CHECK ("discount_amount" >= 0),
                CONSTRAINT "CHK_3b2fc3c8fc4b21cea86d76451b" CHECK ("unit_price" >= 0),
                CONSTRAINT "PK_f4ae859632e43001a3d20141157" PRIMARY KEY ("order_id", "listing_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "order_rating" (
                "rating_id" uuid NOT NULL DEFAULT uuidv7(),
                "order_id" uuid NOT NULL,
                "buyer_id" uuid NOT NULL,
                "rating" smallint NOT NULL,
                "review" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "REL_627b93f91f237874d50044ff7d" UNIQUE ("order_id"),
                CONSTRAINT "REL_5d1a83ea6ba2d133d937e36873" UNIQUE ("buyer_id"),
                CONSTRAINT "CHK_bc9e803c9055a1f728e4ea6e8a" CHECK (
                    "rating" > 0
                    AND "rating" <= 5
                ),
                CONSTRAINT "PK_5ca5e517fe949aa9626cda7eec6" PRIMARY KEY ("rating_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "order_id" uuid NOT NULL DEFAULT uuidv7(),
                "buyer_id" uuid NOT NULL,
                "seller_id" uuid NOT NULL,
                "status" text NOT NULL,
                "sub_total" integer NOT NULL,
                "total" integer NOT NULL,
                "currency" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_7e581861cb4a656b6e01bd8d42" CHECK (length("currency") = 3),
                CONSTRAINT "CHK_138a0fca15978216efb9dceeed" CHECK ("total" >= 0),
                CONSTRAINT "CHK_b02cf00d75821060604f500650" CHECK ("sub_total" >= 0),
                CONSTRAINT "CHK_1da3adac1824bbc6929a0666ca" CHECK (
                    "status" IN (
                        'pending',
                        'confirmed',
                        'awaiting_payment',
                        'delivering',
                        'delivered',
                        'completed',
                        'cancelled'
                    )
                ),
                CONSTRAINT "PK_cad55b3cb25b38be94d2ce831db" PRIMARY KEY ("order_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "order_id" uuid NOT NULL DEFAULT uuidv7(),
                "payment_method" text NOT NULL DEFAULT 'credit_card',
                "payment_status" text NOT NULL,
                "card_last4" text,
                "amount" integer NOT NULL,
                "currency" text NOT NULL,
                "payed_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_17bd8ef2f9e614df00ab8bc95f" CHECK ("amount" >= 0),
                CONSTRAINT "CHK_d8edb45bf83f6c46230627b4ce" CHECK (length("card_last4") = 4),
                CONSTRAINT "CHK_75c0b39bf046ae9493dd76dccc" CHECK ("payment_method" IN ('credit_card')),
                CONSTRAINT "PK_b2f7b823a21562eeca20e72b006" PRIMARY KEY ("order_id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "categories"
            ADD CONSTRAINT "FK_de08738901be6b34d2824a1e243" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_3f1539dda02eba4738ac5859ded" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_9315deed3e8f6d9171c23131418" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "auctions"
            ADD CONSTRAINT "FK_36ca3069d0b14696ec856f0e4b9" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "auctions"
            ADD CONSTRAINT "FK_61c3c7369072cc460c44fc98b92" FOREIGN KEY ("current_bid") REFERENCES "bids"("bid_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bids"
            ADD CONSTRAINT "FK_7d24f04e55838b694acc9d35bfe" FOREIGN KEY ("auction_id") REFERENCES "auctions"("auc_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bids"
            ADD CONSTRAINT "FK_bc7e4d3d2bdc4c8d9695938d8e4" FOREIGN KEY ("bidder_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "cart_details"
            ADD CONSTRAINT "FK_c81e3af806614bbf45024de3ca4" FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "cart_details"
            ADD CONSTRAINT "FK_40ee9d6249648b052cec9834de3" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "carts"
            ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chats"
            ADD CONSTRAINT "FK_e9d682175b587bb8297d32e41f0" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chats"
            ADD CONSTRAINT "FK_a956bacea253f921eab7bb3b14e" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chats"
            ADD CONSTRAINT "FK_f754443807ae962605b6158bf03" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "favourite_listings"
            ADD CONSTRAINT "FK_0e923caa6965f9df7f33e17d1c6" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "favourite_listings"
            ADD CONSTRAINT "FK_4399309f0eae269f55405044a1b" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "FK_55aee3ad82c617c9ba9949c8841" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "FK_e1ba50e3a6915004ea259af99f2" FOREIGN KEY ("admin_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "offers"
            ADD CONSTRAINT "FK_ff1371fdb408ba33d5d08a61629" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "offers"
            ADD CONSTRAINT "FK_f7237fb72e66678736c29030e1d" FOREIGN KEY ("offered_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_9f5c0b96255734666b7b4bc98c3" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_c1787d1874556cb9eb0483a7e2b" FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_43d935655c84101ca66b80739bf" FOREIGN KEY ("offer_id") REFERENCES "offers"("offer_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "order_lines"
            ADD CONSTRAINT "FK_6a619803439ea92778cafc8fb54" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "order_lines"
            ADD CONSTRAINT "FK_181daa074125925f0c6580fc021" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating"
            ADD CONSTRAINT "FK_627b93f91f237874d50044ff7d5" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating"
            ADD CONSTRAINT "FK_5d1a83ea6ba2d133d937e368730" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_5e90e93d0e036c3fadbaefa4d0a" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_ef6710c78c6fbc26d1ba58268ab" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_ef6710c78c6fbc26d1ba58268ab"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_5e90e93d0e036c3fadbaefa4d0a"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating" DROP CONSTRAINT "FK_5d1a83ea6ba2d133d937e368730"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating" DROP CONSTRAINT "FK_627b93f91f237874d50044ff7d5"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_lines" DROP CONSTRAINT "FK_181daa074125925f0c6580fc021"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_lines" DROP CONSTRAINT "FK_6a619803439ea92778cafc8fb54"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_43d935655c84101ca66b80739bf"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_c1787d1874556cb9eb0483a7e2b"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9f5c0b96255734666b7b4bc98c3"
        `);
        await queryRunner.query(`
            ALTER TABLE "offers" DROP CONSTRAINT "FK_f7237fb72e66678736c29030e1d"
        `);
        await queryRunner.query(`
            ALTER TABLE "offers" DROP CONSTRAINT "FK_ff1371fdb408ba33d5d08a61629"
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "FK_e1ba50e3a6915004ea259af99f2"
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "FK_55aee3ad82c617c9ba9949c8841"
        `);
        await queryRunner.query(`
            ALTER TABLE "favourite_listings" DROP CONSTRAINT "FK_4399309f0eae269f55405044a1b"
        `);
        await queryRunner.query(`
            ALTER TABLE "favourite_listings" DROP CONSTRAINT "FK_0e923caa6965f9df7f33e17d1c6"
        `);
        await queryRunner.query(`
            ALTER TABLE "chats" DROP CONSTRAINT "FK_f754443807ae962605b6158bf03"
        `);
        await queryRunner.query(`
            ALTER TABLE "chats" DROP CONSTRAINT "FK_a956bacea253f921eab7bb3b14e"
        `);
        await queryRunner.query(`
            ALTER TABLE "chats" DROP CONSTRAINT "FK_e9d682175b587bb8297d32e41f0"
        `);
        await queryRunner.query(`
            ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"
        `);
        await queryRunner.query(`
            ALTER TABLE "cart_details" DROP CONSTRAINT "FK_40ee9d6249648b052cec9834de3"
        `);
        await queryRunner.query(`
            ALTER TABLE "cart_details" DROP CONSTRAINT "FK_c81e3af806614bbf45024de3ca4"
        `);
        await queryRunner.query(`
            ALTER TABLE "bids" DROP CONSTRAINT "FK_bc7e4d3d2bdc4c8d9695938d8e4"
        `);
        await queryRunner.query(`
            ALTER TABLE "bids" DROP CONSTRAINT "FK_7d24f04e55838b694acc9d35bfe"
        `);
        await queryRunner.query(`
            ALTER TABLE "auctions" DROP CONSTRAINT "FK_61c3c7369072cc460c44fc98b92"
        `);
        await queryRunner.query(`
            ALTER TABLE "auctions" DROP CONSTRAINT "FK_36ca3069d0b14696ec856f0e4b9"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_9315deed3e8f6d9171c23131418"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_3f1539dda02eba4738ac5859ded"
        `);
        await queryRunner.query(`
            ALTER TABLE "categories" DROP CONSTRAINT "FK_de08738901be6b34d2824a1e243"
        `);
        await queryRunner.query(`
            DROP TABLE "payments"
        `);
        await queryRunner.query(`
            DROP TABLE "orders"
        `);
        await queryRunner.query(`
            DROP TABLE "order_rating"
        `);
        await queryRunner.query(`
            DROP TABLE "order_lines"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_messages"
        `);
        await queryRunner.query(`
            DROP TABLE "offers"
        `);
        await queryRunner.query(`
            DROP TABLE "listing_admin_reviews"
        `);
        await queryRunner.query(`
            DROP TABLE "favourite_listings"
        `);
        await queryRunner.query(`
            DROP TABLE "chats"
        `);
        await queryRunner.query(`
            DROP TABLE "carts"
        `);
        await queryRunner.query(`
            DROP TABLE "cart_details"
        `);
        await queryRunner.query(`
            DROP TABLE "bids"
        `);
        await queryRunner.query(`
            DROP TABLE "auctions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9ef4b09d61280166740c65fe8b"
        `);
        await queryRunner.query(`
            DROP TABLE "listings"
        `);
        await queryRunner.query(`
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "database" = $3
                AND "schema" = $4
                AND "table" = $5
        `, ["GENERATED_COLUMN","search_vector","market","public","listings"]);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TABLE "categories"
        `);
    }

}
