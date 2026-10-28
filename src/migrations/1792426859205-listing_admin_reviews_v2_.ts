import { MigrationInterface, QueryRunner } from 'typeorm';

// Add new PK (review_id), remove old PKs
export class ListingAdminReviewsV2_1792426859205 implements MigrationInterface {
  name = 'ListingAdminReviewsV2_1792426859205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD "review_id" uuid NOT NULL DEFAULT uuidv7()
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "PK_dd13c1eddb5e46585872db37bdb"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "PK_91dd2cebc6dd3a517190dd630e1" PRIMARY KEY ("admin_id", "listing_id", "review_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "FK_55aee3ad82c617c9ba9949c8841"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "FK_e1ba50e3a6915004ea259af99f2"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "PK_91dd2cebc6dd3a517190dd630e1"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "PK_e75e0eb08ee693c8ef9a2d10046" PRIMARY KEY ("admin_id", "review_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ALTER COLUMN "listing_id" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "PK_e75e0eb08ee693c8ef9a2d10046"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "PK_e449975435b14b0a15cb7045124" PRIMARY KEY ("review_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ALTER COLUMN "admin_id" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "FK_55aee3ad82c617c9ba9949c8841" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "FK_e1ba50e3a6915004ea259af99f2" FOREIGN KEY ("admin_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "FK_e1ba50e3a6915004ea259af99f2"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "FK_55aee3ad82c617c9ba9949c8841"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ALTER COLUMN "admin_id"
            SET DEFAULT uuidv7()
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "PK_e449975435b14b0a15cb7045124"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "PK_e75e0eb08ee693c8ef9a2d10046" PRIMARY KEY ("admin_id", "review_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ALTER COLUMN "listing_id"
            SET DEFAULT uuidv7()
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "PK_e75e0eb08ee693c8ef9a2d10046"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "PK_91dd2cebc6dd3a517190dd630e1" PRIMARY KEY ("admin_id", "listing_id", "review_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "FK_e1ba50e3a6915004ea259af99f2" FOREIGN KEY ("admin_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "FK_55aee3ad82c617c9ba9949c8841" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP CONSTRAINT "PK_91dd2cebc6dd3a517190dd630e1"
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews"
            ADD CONSTRAINT "PK_dd13c1eddb5e46585872db37bdb" PRIMARY KEY ("admin_id", "listing_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "listing_admin_reviews" DROP COLUMN "review_id"
        `);
  }
}
