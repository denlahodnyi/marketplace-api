import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('refresh_tokens')
@Index(['revokedAt'], { where: `"revoked_at" IS NULL` })
@Index(['tokenHash'], { unique: true })
export class RefreshToken extends primaryAsUuidEntityFactory('id') {
  @Column('uuid', { nullable: false })
  familyId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: false })
  userId: string;

  @Column('text', { nullable: false })
  tokenHash: string;

  @Column('timestamp with time zone', { nullable: true })
  usedAt: string | null;

  @Column('timestamp with time zone', { nullable: true })
  revokedAt: string | null;

  @Column('timestamp with time zone', { nullable: false })
  expiresAt: string;

  @Column('timestamp with time zone', { nullable: false })
  absoluteExpiresAt: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
