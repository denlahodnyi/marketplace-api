import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import type { Auction } from './auction.entity.js';
import type { User } from './user.entity.js';

import { primaryAsUuidEntityFactory } from './shared.js';

@Entity('bids')
@Check(`"status" IN ('active', 'outbidded', 'cancelled')`)
@Check(`"max_amount" > 0`)
// TODO: @Index(['auctionId'], { unique: true, where: `"status" = 'active'` })
export class Bid extends primaryAsUuidEntityFactory('bidId') {
  @ManyToOne('Auction', (auction: Auction) => auction.bids, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'auction_id' })
  auction: Auction;

  @Column('uuid', { nullable: false })
  auctionId: string;

  @ManyToOne('User', { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bidder_id' })
  bidder: User;

  @Column('uuid', { nullable: false })
  bidderId: string;

  @Column('text', { nullable: false })
  status: 'active' | 'outbidded' | 'cancelled';

  @Column('integer', { nullable: false })
  maxAmount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
