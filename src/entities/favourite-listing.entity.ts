import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Listing } from './listing.entity.js';
import { User } from './user.entity.js';

@Entity('favourite_listings')
export class FavouriteListing {
  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  userId: string;

  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  listingId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Listing, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
