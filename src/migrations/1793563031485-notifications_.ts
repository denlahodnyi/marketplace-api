import { MigrationInterface, QueryRunner } from "typeorm";

export class Notifications_1793563031485 implements MigrationInterface {
    name = 'Notifications_1793563031485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "notification_id" uuid NOT NULL DEFAULT uuidv7(),
                "user_id" uuid NOT NULL,
                "event_id" uuid,
                "type" text NOT NULL,
                "title" text NOT NULL,
                "body" text,
                "data" jsonb,
                "read_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_eb0cf729167d3980d9e23901b61" UNIQUE ("user_id", "type", "event_id"),
                CONSTRAINT "CHK_49f292bfd88080e89ffd35d7ae" CHECK (
                    "type" IN (
                        'order_created',
                        'order_confirmed',
                        'order_paid',
                        'order_shipped',
                        'order_completed',
                        'order_cancelled',
                        'listing_approved',
                        'listing_rejected'
                    )
                ),
                CONSTRAINT "PK_eaedfe19f0f765d26afafa85956" PRIMARY KEY ("notification_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification_deliveries" (
                "id" uuid NOT NULL DEFAULT uuidv7(),
                "notification_id" uuid,
                "status" text NOT NULL,
                "channel" text NOT NULL,
                "notificationNotificationId" uuid,
                CONSTRAINT "UQ_1e7ea14e7f96c20db155b8b970e" UNIQUE ("notification_id", "channel"),
                CONSTRAINT "CHK_f6741932bd6331ab8d287d1d9a" CHECK ("channel" IN ('in_app', 'email')),
                CONSTRAINT "CHK_a09d129de9885a211ed121ac9c" CHECK ("status" IN ('pending', 'delivered', 'failed')),
                CONSTRAINT "PK_81daeff81f237bd384f7cfc4a4c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_deliveries"
            ADD CONSTRAINT "FK_c14750876babd8bf52687db29ee" FOREIGN KEY ("notificationNotificationId") REFERENCES "notifications"("notification_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notification_deliveries" DROP CONSTRAINT "FK_c14750876babd8bf52687db29ee"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
        `);
        await queryRunner.query(`
            DROP TABLE "notification_deliveries"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
    }

}
