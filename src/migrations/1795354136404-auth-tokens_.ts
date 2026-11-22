import { MigrationInterface, QueryRunner } from 'typeorm';

// Summary:
// 1. Add table for denylist
// 2. Add table for refresh tokens
export class AuthTokens_1795354136404 implements MigrationInterface {
  name = 'AuthTokens_1795354136404';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "denied_tokens" (
                "jti" uuid NOT NULL,
                "iss" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_eca6d0904da4e444d4f3ae47ed8" PRIMARY KEY ("jti", "iss")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT uuidv7(),
                "family_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "token_hash" text NOT NULL,
                "used_at" TIMESTAMP WITH TIME ZONE,
                "revoked_at" TIMESTAMP WITH TIME ZONE,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "absolute_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_25970549467d0d7de5e666b73e" ON "refresh_tokens" ("revoked_at")
            WHERE "revoked_at" IS NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "refresh_tokens"
            ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_25970549467d0d7de5e666b73e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"
        `);
    await queryRunner.query(`
            DROP TABLE "refresh_tokens"
        `);
    await queryRunner.query(`
            DROP TABLE "denied_tokens"
        `);
  }
}
