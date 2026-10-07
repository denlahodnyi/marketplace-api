import { MigrationInterface, QueryRunner } from "typeorm";

export class FixListingQtyCheck1790462899054 implements MigrationInterface {
    name = 'FixListingQtyCheck1790462899054'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "CHK_d1b098eabeed751cc655efcc48"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "CHK_64ffddb7127be1b787cc21dc3c" CHECK ("quantity" >= 0)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "CHK_64ffddb7127be1b787cc21dc3c"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "CHK_d1b098eabeed751cc655efcc48" CHECK ((quantity > 0))
        `);
    }

}
