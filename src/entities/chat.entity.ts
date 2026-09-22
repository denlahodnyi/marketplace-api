import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import type { ChatMessage } from './message.entity.js';

import { Listing } from './listing.entity.js';
import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('chats')
export class Chat extends primaryAsUuidEntityFactory('chatId') {
  @OneToMany('ChatMessage', (message: ChatMessage) => message.chat)
  messages: ChatMessage[];

  @ManyToOne(() => Listing, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column('uuid')
  listingId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column('uuid')
  buyerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column('uuid')
  sellerId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
