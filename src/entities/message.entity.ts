import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import type { Chat } from './chat.entity.js';

import { Offer } from './offer.entity.js';
import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('chat_messages')
export class ChatMessage extends primaryAsUuidEntityFactory('messageId') {
  @ManyToOne('Chat', (chat: Chat) => chat.messages, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column('uuid', { nullable: false })
  senderId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column('uuid', { nullable: false })
  receiverId: string;

  @OneToOne(() => Offer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'offer_id' })
  offer: Offer | null;

  @Column('uuid', { nullable: true })
  offerId: string | null;

  @Column('text', { nullable: false })
  message: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
