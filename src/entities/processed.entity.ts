import { Column, Entity, PrimaryColumn } from 'typeorm';

export const PROCESSED_CONSUMER = {
  notifications: 'notifications',
} as const;

@Entity('processed_messages')
export class ProcessedMessages {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  messageId: string;

  @PrimaryColumn('text')
  consumer: string;

  @Column('timestamp with time zone', { nullable: false, default: 'now()' })
  processedAt: string;
}
