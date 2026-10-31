import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
} from 'typeorm';

import { primaryAsUuidEntityFactory } from './shared.js';

@Entity('users')
@Check(`"user_role" IN ('admin', 'customer')`)
export class User extends primaryAsUuidEntityFactory('userId') {
  @Column({ length: 254, nullable: false, unique: true })
  email: string;

  @Column('timestamp with time zone', { nullable: true })
  emailVerifiedAt: string | null;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  passwordHash: string | null;

  @Column('text', { nullable: true })
  passwordSalt: string | null;

  @Column('text', { nullable: true })
  phone: string | null;

  @Column('text', { nullable: false })
  userRole: 'admin' | 'customer';

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
