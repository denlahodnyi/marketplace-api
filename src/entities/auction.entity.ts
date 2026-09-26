import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import type { Bid } from './bid.entity.js';

import { Listing } from './listing.entity.js';
import { primaryAsUuidEntityFactory } from './shared.js';

@Entity('auctions')
@Check(`"status" IN ('created', 'active', 'finished', 'cancelled')`)
@Check(`"start_price" > 0`)
@Check(`"reserve_price" >= 0`)
@Check(`"current_price" > 0`)
@Check(`"end_at" > "start_at"`)
export class Auction extends primaryAsUuidEntityFactory('aucId') {
  @OneToMany('Bid', (bid: Bid) => bid.auction)
  bids: Bid[];

  @ManyToOne(() => Listing, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column('uuid', { nullable: false })
  listingId: string;

  @Column('text', { nullable: false })
  status: 'created' | 'active' | 'finished' | 'cancelled';

  @Column('integer', { nullable: false })
  startPrice: number;

  @Column('integer', { nullable: false, default: 0 })
  reservePrice: number;

  @Column('integer', { nullable: true })
  currentPrice: number | null;

  @OneToOne('Bid', { nullable: true })
  @JoinColumn({ name: 'current_bid' })
  topBid: Bid | null;

  @Column('uuid', { nullable: true })
  currentBid: string | null;

  @Column('timestamp with time zone', { nullable: false })
  startAt: string;

  @Column('timestamp with time zone', { nullable: false })
  endAt: string;

  @Column('text', { nullable: true })
  cancelReason: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
