import { MigrationInterface, QueryRunner } from "typeorm";

export class FixBuyerRatingRel1791399945528 implements MigrationInterface {
    name = 'FixBuyerRatingRel1791399945528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "order_rating" DROP CONSTRAINT "FK_5d1a83ea6ba2d133d937e368730"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating" DROP CONSTRAINT "REL_5d1a83ea6ba2d133d937e36873"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating"
            ADD CONSTRAINT "FK_5d1a83ea6ba2d133d937e368730" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "order_rating" DROP CONSTRAINT "FK_5d1a83ea6ba2d133d937e368730"
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating"
            ADD CONSTRAINT "REL_5d1a83ea6ba2d133d937e36873" UNIQUE ("buyer_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "order_rating"
            ADD CONSTRAINT "FK_5d1a83ea6ba2d133d937e368730" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

}
