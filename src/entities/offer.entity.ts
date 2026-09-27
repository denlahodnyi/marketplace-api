import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import type { Listing } from './listing.entity.js';

import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('offers')
@Check(`"price" >= 0`)
@Check(`"status" IN ('rejected', 'accepted', 'cancelled')`)
export class Offer extends primaryAsUuidEntityFactory('offerId') {
  @ManyToOne('Listing', (listing: Listing) => listing.offers, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column('uuid', { nullable: false })
  listingId: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'offered_by' })
  offerAuthor: User;

  @Column('uuid', { nullable: false })
  offeredBy: string;

  @Column('integer', { nullable: false })
  price: number;

  @Column('text', { nullable: false }) // TODO: make it nullable or add pending status
  status: 'rejected' | 'accepted' | 'cancelled';

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
