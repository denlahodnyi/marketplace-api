import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderNotifications1790786361279 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE orders_notifications (
            order_id uuid NOT NULL,
            notified bool NOT NULL DEFAULT FALSE
        );
    `);
    await queryRunner.query(`
        ALTER TABLE "orders_notifications"
        ADD CONSTRAINT "FK_order_notifications_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "orders_notifications" DROP CONSTRAINT "FK_order_notifications_order_id"
    `);
    await queryRunner.query(`DROP TABLE orders_notifications;`);
  }
}
