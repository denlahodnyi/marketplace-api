import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { primaryAsUuidEntityFactory } from './shared.js';

@Entity()
@Index(['publishedAt'], { where: `"published_at" IS NULL` })
export class Outbox extends primaryAsUuidEntityFactory('id') {
  @Column('text', { nullable: false })
  aggregateType: string;

  @Column('text', { nullable: false })
  aggregateId: string;

  @Column('text', { nullable: false })
  type: string;

  @Column('jsonb', { nullable: false })
  payload: object;

  @Column('integer', { nullable: false, default: 0 })
  attempts: number;

  @Column('timestamp with time zone', { nullable: true })
  publishedAt: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', nullable: false })
  createdAt: string;
}
