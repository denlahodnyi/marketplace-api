import { MigrationInterface, QueryRunner } from 'typeorm';

// Summary:
// 1. Add outbox for order creation
// 2. Remove incorrect "notificationNotificationId" column
// 3. Add order idempotency-key
// 3. Add processed_messages
export class Outbox_1794595292823 implements MigrationInterface {
  name = 'Outbox_1794595292823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "notification_deliveries" DROP CONSTRAINT "FK_c14750876babd8bf52687db29ee"
        `);
    await queryRunner.query(`
            CREATE TABLE "outbox" (
                "id" uuid NOT NULL DEFAULT uuidv7(),
                "aggregate_type" text NOT NULL,
                "aggregate_id" text NOT NULL,
                "type" text NOT NULL,
                "payload" jsonb NOT NULL,
                "attempts" integer NOT NULL DEFAULT '0',
                "published_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f180704d64bd2a255876a841c4" ON "outbox" ("published_at")
            WHERE "published_at" IS NULL
        `);
    await queryRunner.query(`
            CREATE TABLE "processed_messages" (
                "message_id" uuid NOT NULL DEFAULT uuidv7(),
                "consumer" text NOT NULL,
                "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()',
                CONSTRAINT "PK_d4853eee97acfc588e49f9290d1" PRIMARY KEY ("message_id", "consumer")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_deliveries" DROP COLUMN "notificationNotificationId"
        `);
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "idempotency_key" uuid
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_59d6b7756aeb6cbb43a093d15a" ON "orders" ("idempotency_key")
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_deliveries"
            ADD CONSTRAINT "FK_435486b970fffc3e33a7450ee97" FOREIGN KEY ("notification_id") REFERENCES "notifications"("notification_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "notification_deliveries" DROP CONSTRAINT "FK_435486b970fffc3e33a7450ee97"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_59d6b7756aeb6cbb43a093d15a"
        `);
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "idempotency_key"
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_deliveries"
            ADD "notificationNotificationId" uuid
        `);
    await queryRunner.query(`
            DROP TABLE "processed_messages"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f180704d64bd2a255876a841c4"
        `);
    await queryRunner.query(`
            DROP TABLE "outbox"
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_deliveries"
            ADD CONSTRAINT "FK_c14750876babd8bf52687db29ee" FOREIGN KEY ("notificationNotificationId") REFERENCES "notifications"("notification_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
